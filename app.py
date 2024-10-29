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
