# app.py
from flask import Flask, request, jsonify, send_from_directory
from datetime import datetime
import os
from pymongo import MongoClient
from bson import ObjectId
import json
from flask_cors import CORS
import urllib.parse

app = Flask(__name__, static_url_path='/static', static_folder='static')
CORS(app)

# Configuração MongoDB sem SSL
MONGODB_URI = "mongodb+srv://pardinithales:GLS6KUhOtANEgQvS@cluster0.uqh21.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0&ssl=false&tlsAllowInvalidCertificates=true"

# Conectar ao MongoDB
try:
    client = MongoClient(MONGODB_URI, connect=False)  # Conexão lazy
    db = client.miopatia_db
    print("MongoDB configurado")
except Exception as e:
    print(f"Erro ao configurar MongoDB: {str(e)}")
    
@app.route('/')
def home():
    return send_from_directory('.', 'index.html')

@app.route('/api/test')
def test():
    try:
        # Testar conexão
        db.command('ping')
        return jsonify({"status": "ok", "message": "Conexão MongoDB funcionando"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/mrc', methods=['POST'])
def save_mrc_data():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Dados não fornecidos"}), 400

        # Validar e processar data
        try:
            date_obj = datetime.strptime(data.get('dataAvaliacao', ''), '%Y-%m-%d')
            data['dataAvaliacao'] = date_obj.strftime('%d/%m/%Y')
        except ValueError as e:
            return jsonify({"error": f"Data inválida: {str(e)}"}), 400

        # Calcular MRC total
        mrc_fields = [
            'mrcDeltoideDireito', 'mrcDeltoideEsquerdo',
            'mrcBicepsDireito', 'mrcBicepsEsquerdo',
            'mrcExtensorCarpoDireito', 'mrcExtensorCarpoEsquerdo',
            'mrcIliopsoasDireito', 'mrcIliopsoasEsquerdo',
            'mrcRetoFemoralDireito', 'mrcRetoFemoralEsquerdo',
            'mrcExtensorPeDireito', 'mrcExtensorPeEsquerdo'
        ]
        
        mrc_total = 0
        for field in mrc_fields:
            try:
                value = int(data.get(field, 0) or 0)
                mrc_total += value
            except ValueError:
                mrc_total += 0
                
        data['mrc_total'] = mrc_total
        data['created_at'] = datetime.utcnow()

        # Salvar no banco
        result = db.patients.insert_one(data)
        return jsonify({"message": "Dados salvos com sucesso!", "id": str(result.inserted_id)}), 201

    except Exception as e:
        print(f"Erro ao salvar: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/patients', methods=['GET'])
def get_patients():
    try:
        patients = list(db.patients.find().sort('created_at', -1))
        for p in patients:
            p['_id'] = str(p['_id'])
        return jsonify(patients), 200
    except Exception as e:
        print(f"Erro ao buscar pacientes: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/static/<path:path>')
def static_file(path):
    return send_from_directory('static', path)

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
