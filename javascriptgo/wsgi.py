from flask import Flask
app = Flask(__name__)

from javascriptgo.simple_page import simple_page

app.register_blueprint(simple_page)
