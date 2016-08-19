from javascriptgo.wsgi import app

if __name__ == "__main__":
    app.config['DEBUG'] = True
    app.run(port=8080)
