from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import psycopg2
from prophet import Prophet
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense
import warnings
import traceback
warnings.filterwarnings('ignore')

app = Flask(__name__)
CORS(app)

import os
from dotenv import load_dotenv

load_dotenv()

def get_db():
    return psycopg2.connect(
        host="localhost", 
        database="web_analytics_platform",
        user="postgres", 
        password=os.getenv('DB_PASSWORD', 'postgres'),  # From .env
        port=5433
    )

def get_transactions(business_id):
    conn = get_db()
    df = pd.read_sql("""
        SELECT DATE_TRUNC('month', transaction_date) AS ds, SUM(amount) AS y
        FROM transactions WHERE business_id = %s
        GROUP BY ds ORDER BY ds
    """, conn, params=(business_id,))
    conn.close()
    df['ds'] = pd.to_datetime(df['ds'])
    df['y']  = df['y'].astype(float)
    return df

def save_forecasts(business_id, predictions):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO model_runs (business_id, kpi_id, status)
        VALUES (%s, 1, 'Completed') RETURNING run_id
    """, (business_id,))
    run_id = cursor.fetchone()[0]
    for _, row in predictions.iterrows():
        cursor.execute("""
            INSERT INTO forecasts (run_id, forecast_date, forecast_value)
            VALUES (%s, %s, %s)
        """, (run_id, row['ds'].date(), round(float(row['yhat']), 2)))
    conn.commit(); cursor.close(); conn.close()
    return run_id

@app.route('/ml/health', methods=['GET'])
def health():
    return jsonify({ 'status': 'ok', 'models': ['Prophet', 'LSTM'] })

@app.route('/ml/prophet', methods=['POST'])
def prophet_forecast():
    try:
        from sklearn.metrics import mean_absolute_error, mean_squared_error
        
        data        = request.json
        business_id = data.get('business_id', 1)
        periods     = data.get('periods', 6)
        df = get_transactions(business_id)
        if len(df) < 6:
            return jsonify({ 'error': 'Min 6 muaj të dhëna.' }), 400
        
        # ── Train/Test SPLIT (vetëm për metrics) ──
        split = int(len(df) * 0.8)
        df_train = df.iloc[:split]
        df_test = df.iloc[split:]
        
        # ── Trajnim mbi FULL dataset ──
        model = Prophet(yearly_seasonality=True, weekly_seasonality=False, daily_seasonality=False)
        model.fit(df)
        
        # ── Metrakat mbi test set ──
        test_forecast = model.predict(model.make_future_dataframe(periods=len(df_test), freq='MS')).iloc[-len(df_test):]
        mae = mean_absolute_error(df_test['y'].values, test_forecast['yhat'].values)
        rmse = np.sqrt(mean_squared_error(df_test['y'].values, test_forecast['yhat'].values))
        mape = np.mean(np.abs((df_test['y'].values - test_forecast['yhat'].values) / df_test['y'].values)) * 100
        
        # ── Parashikimi për ardhmen ──
        future = model.make_future_dataframe(periods=periods, freq='MS')
        forecast = model.predict(future)
        future_only = forecast[forecast['ds'] > df['ds'].max()][['ds','yhat','yhat_lower','yhat_upper']]
        run_id = save_forecasts(business_id, future_only)
        
        return jsonify({
            'model': 'Prophet', 'run_id': run_id,
            'metrics': {'MAE': float(mae), 'RMSE': float(rmse), 'MAPE': float(mape)},
            'forecasts': future_only.assign(ds=future_only['ds'].dt.strftime('%Y-%m-%d')).to_dict('records')
        })
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return jsonify({ 'error': str(e) }), 500

@app.route('/ml/lstm', methods=['POST'])
def lstm_forecast():
    try:
        data        = request.json
        business_id = data.get('business_id', 1)
        periods     = data.get('periods', 6)
        print(f"🔍 DEBUG: business_id={business_id}, periods={periods}")  # ← Add
        
        df = get_transactions(business_id)
        print(f"🔍 DEBUG: DataFrame shape={df.shape}, len={len(df)}")  # ← Add
        if len(df) < 6:
            return jsonify({ 'error': 'Min 6 muaj të dhëna.' }), 400
        
        # ── Train/Test Split PËRPARA normalizimit ──
        split = int(len(df) * 0.8)
        df_train = df.iloc[:split]
        df_test = df.iloc[split:]
        
        # ── Normalizimi - fit vetëm mbi TRAIN ──
        scaler = MinMaxScaler()
        train_scaled = scaler.fit_transform(df_train['y'].values.reshape(-1,1))
        test_scaled = scaler.transform(df_test['y'].values.reshape(-1,1))
        
        # ── Sekuencat TRAIN ──
        seq_len = 3
        X_train, y_train = [], []
        for i in range(len(train_scaled)-seq_len):
            X_train.append(train_scaled[i:i+seq_len])
            y_train.append(train_scaled[i+seq_len])
        X_train, y_train = np.array(X_train), np.array(y_train)
        
        # ── Sekuencat TEST ──
        X_test, y_test = [], []
        for i in range(len(test_scaled)-seq_len):
            X_test.append(test_scaled[i:i+seq_len])
            y_test.append(test_scaled[i+seq_len])
        X_test, y_test = np.array(X_test), np.array(y_test)
        
        # ── Trajnim VETËM mbi TRAIN ──
        model = Sequential([LSTM(64, activation='relu', input_shape=(seq_len,1)), Dense(1)])
        model.compile(optimizer='adam', loss='mse')
        model.fit(X_train, y_train, epochs=150, verbose=0)
        
        # ── Parashikimi mbi TEST + future ──
        from sklearn.metrics import mean_absolute_error, mean_squared_error
        
        # Metrakat mbi test set
        test_preds = model.predict(X_test, verbose=0).flatten()
        mae = mean_absolute_error(y_test, test_preds)
        rmse = np.sqrt(mean_squared_error(y_test, test_preds))
        mae = mean_absolute_error(y_test, test_preds)
        rmse = np.sqrt(mean_squared_error(y_test, test_preds))
        mape = np.mean(np.abs((y_test - test_preds) / y_test)) * 100
        
        # ← Add inverse transform:
        mae_real = scaler.inverse_transform([[mae]])[0][0]
        rmse_real = scaler.inverse_transform([[rmse]])[0][0]
        
        print(f"📊 LSTM METRICS (REAL VALUES):")
        print(f"   MAE:  ${mae_real:.2f}")
        print(f"   RMSE: ${rmse_real:.2f}")
        print(f"   MAPE: {mape:.2f}%")
        mape = np.mean(np.abs((y_test - test_preds) / y_test)) * 100
        
        # Parashikimi i 6 muajve të ardhshëm
        preds, last_seq = [], test_scaled[-seq_len:].reshape(1,seq_len,1)
        periods_int = data.get('periods', 6)
        for _ in range(periods_int):
            p = model.predict(last_seq, verbose=0)
            preds.append(p[0,0])
            last_seq = np.append(last_seq[:,1:,:], p.reshape(1,1,1), axis=1)
        lstm_preds = scaler.inverse_transform(np.array(preds).reshape(-1,1))
        future_dates = pd.date_range(start=df['ds'].max()+pd.DateOffset(months=1), periods=periods_int, freq='MS')
        future_df = pd.DataFrame({'ds': future_dates, 'yhat': lstm_preds.flatten()})
        run_id = save_forecasts(business_id, future_df)
        
        mae_real = scaler.inverse_transform([[mae]])[0][0]
        rmse_real = scaler.inverse_transform([[rmse]])[0][0]

        return jsonify({
         'model': 'LSTM', 'run_id': run_id,
         'metrics': {'MAE': float(mae_real), 'RMSE': float(rmse_real), 'MAPE': float(mape)},
         'forecasts': future_df.assign(ds=future_df['ds'].dt.strftime('%Y-%m-%d')).to_dict('records')
})
    except Exception as e:
        print(f"❌ ERROR in LSTM: {str(e)}")  # ← Add
        import traceback
        print(traceback.format_exc())  # ← Add
        return jsonify({ 'error': str(e) }), 500

if __name__ == '__main__':
    print("🚀 ML API duke u nisur në http://localhost:5000")
    app.run(port=5000, debug=True)  # ← Change False to True


    