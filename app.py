from flask import Flask, request, jsonify, send_from_directory
from datetime import datetime
import os
import json
from threading import Lock

app = Flask(__name__, static_url_path='/static', static_folder='static')

# Novas configurações de armazenamento
DATA_FILE = 'data.json'
lock = Lock()

def load_data():
    try:
        if os.path.exists(DATA_FILE):
            with open(DATA_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        return []
    except Exception as e:
        print(f"Erro ao carregar dados: {e}")
        return []

def save_data(data):
    try:
        with lock:
            with open(DATA_FILE, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=4)
    except Exception as e:
        print(f"Erro ao salvar dados: {e}")
        raise

@app.route('/api/mrc', methods=['POST'])
def save_mrc_data():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Dados não fornecidos"}), 400

        # Carregar dados existentes
        all_data = load_data()
        
        # Adicionar ID único
        data['id'] = len(all_data) + 1
        
        # Adicionar novo registro
        all_data.append(data)
        
        # Salvar dados atualizados
        save_data(all_data)
        
        return jsonify({"message": "Dados salvos com sucesso!", "id": data['id']}), 201

    except Exception as e:
        print(f"Erro ao salvar dados: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/patients', methods=['GET'])
def get_patients():
    try:
        data = load_data()
        data.sort(key=lambda x: datetime.strptime(x.get('dataAvaliacao', '01/01/1900'), '%d/%m/%Y'), reverse=True)
        return jsonify(data), 200
    except Exception as e:
        print(f"Erro ao recuperar pacientes: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/')
def serve_html():
    return send_from_directory('.', 'index.html')

@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory(app.static_folder, filename)

if __name__ == '__main__':
    if not os.path.exists(DATA_FILE):
        save_data([])  # Criar arquivo JSON vazio se não existir
    app.run(debug=True)
