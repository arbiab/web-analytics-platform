import requests

response = requests.post(
    'http://localhost:5000/ml/lstm',
    json={'business_id': 1, 'periods': 6}
)

result = response.json()
if 'metrics' in result:
    print(f"MAE:  {result['metrics']['MAE']}")
    print(f"RMSE: {result['metrics']['RMSE']}")
    print(f"MAPE: {result['metrics']['MAPE']}")