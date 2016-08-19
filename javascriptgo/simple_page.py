from flask import Blueprint, render_template

simple_page = Blueprint(
    'simple_page',
    __name__,
    template_folder='templates'
)


@simple_page.route('/')
def homepage():
    return render_template(
        'index.html',
    )
