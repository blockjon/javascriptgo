deploy:
	git push origin master
	git push heroku master
buildlocalenv:
	virtualenv venv
	pip install -r requirements.txt
localdev:
	( \
		source venv/bin/activate; \
		python flasklocal.py \
	)