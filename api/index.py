﻿from app import app

# Vercel handler
def handler(request, context):
    return app(request)
