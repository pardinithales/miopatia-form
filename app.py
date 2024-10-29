from flask import Flask, request, jsonify, send_from_directory
from pymongo import MongoClient
from datetime import datetime
import os
from os import environ
from dotenv import load_dotenv

load_dotenv()  # carrega variáveis do .env

# Configuração do aplicativo Flask
app = Flask(__name__, static_url_path='/static', static_folder='static')

# Configuração da conexão com MongoDB
client = MongoClient(environ.get('MONGODB_URI'))
db = client['miopatia_db']  # Substitua pelo nome desejado para o banco
mrc_collection = db['mrc_data']  # Nome da coleção onde os dados MRC serão armazenados

# Função para converter os dados do MongoDB para um dicionário
def to_dict(data):
    return {
        'id': str(data.get('_id')),
        'registroHC': data.get('registroHC'),
        'dataAvaliacao': data.get('dataAvaliacao').strftime('%d/%m/%Y') if data.get('dataAvaliacao') else None,
        'idade': data.get('idade'),
        'mrcDeltoideDireito': data.get('mrcDeltoideDireito'),
        'mrcDeltoideEsquerdo': data.get('mrcDeltoideEsquerdo'),
        'mrcBicepsDireito': data.get('mrcBicepsDireito'),
        'mrcBicepsEsquerdo': data.get('mrcBicepsEsquerdo'),
        'mrcExtensorCarpoDireito': data.get('mrcExtensorCarpoDireito'),
        'mrcExtensorCarpoEsquerdo': data.get('mrcExtensorCarpoEsquerdo'),
        'mrcIliopsoasDireito': data.get('mrcIliopsoasDireito'),
        'mrcIliopsoasEsquerdo': data.get('mrcIliopsoasEsquerdo'),
        'mrcRetoFemoralDireito': data.get('mrcRetoFemoralDireito'),
        'mrcRetoFemoralEsquerdo': data.get('mrcRetoFemoralEsquerdo'),
        'mrcExtensorPeDireito': data.get('mrcExtensorPeDireito'),
        'mrcExtensorPeEsquerdo': data.get('mrcExtensorPeEsquerdo'),
        'cpkMinimo': data.get('cpkMinimo'),
        'cpkMaximo': data.get('cpkMaximo'),
        'lactatoMinimo': data.get('lactatoMinimo'),
        'lactatoMaximo': data.get('lactatoMaximo'),
        'tgoMinimo': data.get('tgoMinimo'),
        'tgoMaximo': data.get('tgoMaximo'),
        'tgpMinimo': data.get('tgpMinimo'),
        'tgpMaximo': data.get('tgpMaximo'),
        'dorPresente': data.get('dorPresente'),
        'intensidadeDor': data.get('intensidadeDor'),
        'padraoDor': data.get('padraoDor'),
        'fadigaPresente': data.get('fadigaPresente'),
        'intensidadeFadiga': data.get('intensidadeFadiga'),
        'fatorFadiga': data.get('fatorFadiga'),
        'caibrasPresente': data.get('caibrasPresente'),
        'frequenciaCaibras': data.get('frequenciaCaibras'),
        'localizacaoCaibras': data.get('localizacaoCaibras'),
        'historicoFamiliar': data.get('historicoFamiliar'),
        'parentescoAcometido': data.get('parentescoAcometido'),
        'manifestacoesCardiacas': data.get('manifestacoesCardiacas'),
        'manifestacoesRespiratorias': data.get('manifestacoesRespiratorias'),
        'manifestacoesEndocrinas': data.get('manifestacoesEndocrinas')
    }

@app.route('/api/mrc', methods=['POST'])
def save_mrc_data():
    try:
        data = request.json
        print("Dados recebidos:", data)  # Debug print
        
        # Conversão da data de avaliação para formato datetime
        data_avaliacao = datetime.strptime(data.get('dataAvaliacao', ''), '%Y-%m-%d')
        
        new_mrc_data = {
            'registroHC': data.get('registroHC'),
            'dataAvaliacao': data_avaliacao,
            'idade': data.get('idade'),
            'mrcDeltoideDireito': int(data.get('mrcDeltoideDireito') or 0),
            'mrcDeltoideEsquerdo': int(data.get('mrcDeltoideEsquerdo') or 0),
            'mrcBicepsDireito': int(data.get('mrcBicepsDireito') or 0),
            'mrcBicepsEsquerdo': int(data.get('mrcBicepsEsquerdo') or 0),
            'mrcExtensorCarpoDireito': int(data.get('mrcExtensorCarpoDireito') or 0),
            'mrcExtensorCarpoEsquerdo': int(data.get('mrcExtensorCarpoEsquerdo') or 0),
            'mrcIliopsoasDireito': int(data.get('mrcIliopsoasDireito') or 0),
            'mrcIliopsoasEsquerdo': int(data.get('mrcIliopsoasEsquerdo') or 0),
            'mrcRetoFemoralDireito': int(data.get('mrcRetoFemoralDireito') or 0),
            'mrcRetoFemoralEsquerdo': int(data.get('mrcRetoFemoralEsquerdo') or 0),
            'mrcExtensorPeDireito': int(data.get('mrcExtensorPeDireito') or 0),
            'mrcExtensorPeEsquerdo': int(data.get('mrcExtensorPeEsquerdo') or 0),
            'cpkMinimo': float(data.get('cpkMinimo') or 0),
            'cpkMaximo': float(data.get('cpkMaximo') or 0),
            'lactatoMinimo': float(data.get('lactatoMinimo') or 0),
            'lactatoMaximo': float(data.get('lactatoMaximo') or 0),
            'tgoMinimo': float(data.get('tgoMinimo') or 0),
            'tgoMaximo': float(data.get('tgoMaximo') or 0),
            'tgpMinimo': float(data.get('tgpMinimo') or 0),
            'tgpMaximo': float(data.get('tgpMaximo') or 0),
            'dorPresente': data.get('dorPresente'),
            'intensidadeDor': int(data.get('intensidadeDor') or 0),
            'padraoDor': data.get('padraoDor'),
            'fadigaPresente': data.get('fadigaPresente'),
            'intensidadeFadiga': int(data.get('intensidadeFadiga') or 0),
            'fatorFadiga': data.get('fatorFadiga'),
            'caibrasPresente': data.get('caibrasPresente'),
            'frequenciaCaibras': data.get('frequenciaCaibras'),
            'localizacaoCaibras': data.get('localizacaoCaibras'),
            'historicoFamiliar': data.get('historicoFamiliar'),
            'parentescoAcometido': data.get('parentescoAcometido'),
            'manifestacoesCardiacas': data.get('manifestacoesCardiacas'),
            'manifestacoesRespiratorias': data.get('manifestacoesRespiratorias'),
            'manifestacoesEndocrinas': data.get('manifestacoesEndocrinas')
        }
        
        result = mrc_collection.insert_one(new_mrc_data)
        print("Dados salvos com ID:", result.inserted_id)
        
        return jsonify({"message": "Dados salvos com sucesso!"}), 201
        
    except Exception as e:
        print("Erro ao salvar:", str(e))  # Debug print
        return jsonify({"error": str(e)}), 400

@app.route('/api/patients', methods=['GET'])
def get_patients():
    try:
        patients = list(mrc_collection.find().sort("dataAvaliacao", -1))
        patients_data = [to_dict(patient) for patient in patients]
        
        print(f"Pacientes recuperados: {len(patients_data)}")  # Debug
        return jsonify(patients_data), 200
        
    except Exception as e:
        print("Erro ao recuperar pacientes:", str(e))
        return jsonify({"error": str(e)}), 400

@app.route('/')
def serve_html():
    return send_from_directory('.', 'index.html')

@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory(app.static_folder, filename)

if __name__ == '__main__':
    app.run(debug=True)
