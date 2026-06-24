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
warnings.filterwarnings('ignore')

app = Flask(__name__)
CORS(app)

def get_db():
    return psycopg2.connect(
        host="localhost", database="web_analytics_platform",
        user="postgres", password="123456", port=5433
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
        data        = request.json
        business_id = data.get('business_id', 1)
        periods     = data.get('periods', 6)
        df = get_transactions(business_id)
        if len(df) < 3:
            return jsonify({ 'error': 'Min 3 muaj të dhëna.' }), 400
        model = Prophet(yearly_seasonality=True, weekly_seasonality=False, daily_seasonality=False)
        model.fit(df)
        future   = model.make_future_dataframe(periods=periods, freq='MS')
        forecast = model.predict(future)
        future_only = forecast[forecast['ds'] > df['ds'].max()][['ds','yhat','yhat_lower','yhat_upper']]
        run_id = save_forecasts(business_id, future_only)
        return jsonify({
            'model': 'Prophet', 'run_id': run_id,
            'forecasts': future_only.assign(ds=future_only['ds'].dt.strftime('%Y-%m-%d')).to_dict('records')
        })
    except Exception as e:
        return jsonify({ 'error': str(e) }), 500

@app.route('/ml/lstm', methods=['POST'])
def lstm_forecast():
    try:
        data        = request.json
        business_id = data.get('business_id', 1)
        periods     = data.get('periods', 6)
        df = get_transactions(business_id)
        if len(df) < 6:
            return jsonify({ 'error': 'Min 6 muaj të dhëna.' }), 400
        scaler = MinMaxScaler()
        scaled = scaler.fit_transform(df['y'].values.reshape(-1,1))
        seq_len = min(6, len(scaled)-1)
        X, y_t = [], []
        for i in range(len(scaled)-seq_len):
            X.append(scaled[i:i+seq_len]); y_t.append(scaled[i+seq_len])
        X, y_t = np.array(X), np.array(y_t)
        model = Sequential([LSTM(64, activation='relu', input_shape=(seq_len,1)), Dense(1)])
        model.compile(optimizer='adam', loss='mse')
        model.fit(X, y_t, epochs=100, verbose=0)
        preds, last_seq = [], scaled[-seq_len:].reshape(1,seq_len,1)
        for _ in range(periods):
            p = model.predict(last_seq, verbose=0)
            preds.append(p[0,0])
            last_seq = np.append(last_seq[:,1:,:], p.reshape(1,1,1), axis=1)
        lstm_preds = scaler.inverse_transform(np.array(preds).reshape(-1,1))
        future_dates = pd.date_range(start=df['ds'].max()+pd.DateOffset(months=1), periods=periods, freq='MS')
        future_df = pd.DataFrame({'ds': future_dates, 'yhat': lstm_preds.flatten()})
        run_id = save_forecasts(business_id, future_df)
        return jsonify({
            'model': 'LSTM', 'run_id': run_id,
            'forecasts': future_df.assign(ds=future_df['ds'].dt.strftime('%Y-%m-%d')).to_dict('records')
        })
    except Exception as e:
        return jsonify({ 'error': str(e) }), 500

if __name__ == '__main__':
    print("🚀 ML API duke u nisur në http://localhost:5000")
    app.run(port=5000, debug=False)