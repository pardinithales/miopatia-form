# app.py
from flask import Flask, request, jsonify, send_from_directory
from datetime import datetime
import os
from pymongo import MongoClient, ASCENDING, DESCENDING
from bson import ObjectId
import json
from flask_cors import CORS
import time

app = Flask(__name__, static_url_path='/static', static_folder='static')
CORS(app)

# Configuração MongoDB com timeouts menores
MONGODB_URI = "mongodb+srv://pardinithales:GLS6KUhOtANEgQvS@cluster0.uqh21.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

try:
    print("Iniciando conexão com MongoDB...")
    client = MongoClient(
        MONGODB_URI,
        serverSelectionTimeoutMS=5000,
        connectTimeoutMS=5000,
        socketTimeoutMS=5000
    )
    # Testar a conexão
    client.server_info()
    print("Conexão com MongoDB estabelecida com sucesso!")
    db = client.miopatia_db
    patients = db.patients
except Exception as e:
    print(f"Erro ao conectar com MongoDB: {e}")
    raise

def calculate_mrc_total(data):
    mrc_fields = [
        'mrcDeltoideDireito', 'mrcDeltoideEsquerdo',
        'mrcBicepsDireito', 'mrcBicepsEsquerdo',
        'mrcExtensorCarpoDireito', 'mrcExtensorCarpoEsquerdo',
        'mrcIliopsoasDireito', 'mrcIliopsoasEsquerdo',
        'mrcRetoFemoralDireito', 'mrcRetoFemoralEsquerdo',
        'mrcExtensorPeDireito', 'mrcExtensorPeEsquerdo'
    ]
    return sum(int(data.get(field, 0) or 0) for field in mrc_fields)

@app.route('/api/mrc', methods=['POST'])
def save_mrc_data():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Dados não fornecidos"}), 400

        # Converter a data
        try:
            date_obj = datetime.strptime(data.get('dataAvaliacao', ''), '%Y-%m-%d')
            data['dataAvaliacao'] = date_obj.strftime('%d/%m/%Y')
        except ValueError as e:
            return jsonify({"error": f"Erro na data: {str(e)}"}), 400

        # Calcular MRC total
        data['mrc_total'] = calculate_mrc_total(data)
        
        # Adicionar timestamp
        data['created_at'] = datetime.utcnow()

        # Inserir no MongoDB
        result = patients.insert_one(data)
        
        return jsonify({
            "message": "Dados salvos com sucesso!", 
            "id": str(result.inserted_id)
        }), 201

    except Exception as e:
        print(f"Erro ao salvar dados: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/patients', methods=['GET'])
def get_patients():
    try:
        print("Buscando pacientes...")
        # Buscar todos os pacientes ordenados por data
        cursor = patients.find({}).sort('created_at', DESCENDING)
        patients_data = []
        
        for patient in cursor:
            patient['_id'] = str(patient['_id'])
            patients_data.append(patient)

        print(f"Encontrados {len(patients_data)} pacientes")
        return jsonify(patients_data), 200

    except Exception as e:
        print(f"Erro ao recuperar pacientes: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/')
def serve_html():
    return send_from_directory('.', 'index.html')

@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory(app.static_folder, filename)

@app.route('/api/export/csv', methods=['GET'])
def export_csv():
    try:
        cursor = patients.find({}).sort('created_at', DESCENDING)
        data = list(cursor)
        
        if not data:
            return jsonify({"error": "Nenhum dado disponível"}), 404

        headers = [
            'Registro HC', 'Data Avaliação', 'MRC Total',
            'Deltóide Direito', 'Deltóide Esquerdo',
            'Bíceps Direito', 'Bíceps Esquerdo',
            'Extensor Carpo Direito', 'Extensor Carpo Esquerdo',
            'Iliopsoas Direito', 'Iliopsoas Esquerdo',
            'Reto Femoral Direito', 'Reto Femoral Esquerdo',
            'Extensor Pé Direito', 'Extensor Pé Esquerdo',
            'CPK Mínimo', 'CPK Máximo',
            'Lactato Mínimo', 'Lactato Máximo',
            'TGO Mínimo', 'TGO Máximo',
            'TGP Mínimo', 'TGP Máximo'
        ]

        csv_content = ",".join(headers) + "\n"
        
        for patient in data:
            row = [
                str(patient.get('registroHC', '')),
                patient.get('dataAvaliacao', ''),
                str(patient.get('mrc_total', '0')),
                str(patient.get('mrcDeltoideDireito', '0')),
                str(patient.get('mrcDeltoideEsquerdo', '0')),
                str(patient.get('mrcBicepsDireito', '0')),
                str(patient.get('mrcBicepsEsquerdo', '0')),
                str(patient.get('mrcExtensorCarpoDireito', '0')),
                str(patient.get('mrcExtensorCarpoEsquerdo', '0')),
                str(patient.get('mrcIliopsoasDireito', '0')),
                str(patient.get('mrcIliopsoasEsquerdo', '0')),
                str(patient.get('mrcRetoFemoralDireito', '0')),
                str(patient.get('mrcRetoFemoralEsquerdo', '0')),
                str(patient.get('mrcExtensorPeDireito', '0')),
                str(patient.get('mrcExtensorPeEsquerdo', '0')),
                str(patient.get('cpkMinimo', '0')),
                str(patient.get('cpkMaximo', '0')),
                str(patient.get('lactatoMinimo', '0')),
                str(patient.get('lactatoMaximo', '0')),
                str(patient.get('tgoMinimo', '0')),
                str(patient.get('tgoMaximo', '0')),
                str(patient.get('tgpMinimo', '0')),
                str(patient.get('tgpMaximo', '0'))
            ]
            csv_content += ",".join(f'"{str(value)}"' for value in row) + "\n"

        return csv_content, 200, {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': f'attachment; filename=miopatias_{datetime.now().strftime("%Y%m%d")}.csv'
        }

    except Exception as e:
        print(f"Erro ao exportar CSV: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
