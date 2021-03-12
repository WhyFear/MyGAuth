from datetime import timedelta
from flask import Flask, request, redirect, url_for, render_template, flash, session
from flask_login import LoginManager, login_user, logout_user, current_user, login_required
from models import User, query_user
from form import LoginForm
from dotenv import load_dotenv
import os

load_dotenv(encoding='utf8')

app = Flask(__name__)
app.secret_key = os.getenv("APP_SECRET_KEY")
app.config['RECAPTCHA_USE_SSL'] = True
app.config['RECAPTCHA_PUBLIC_KEY'] = os.getenv("RECAPTCHA_PUBLIC_KEY")
app.config['RECAPTCHA_PRIVATE_KEY'] = os.getenv("RECAPTCHA_PRIVATE_KEY")
app.config['RECAPTCHA_OPTIONS'] = {'theme': 'black'}

login_manager = LoginManager()
login_manager.login_view = 'login'
login_manager.init_app(app)
# login_manager.remember_cookie_duration = timedelta(minutes=1)


@login_manager.user_loader
def load_user(user_id):
    if query_user(user_id) is not None:
        curr_user = User()
        curr_user.id = user_id
        return curr_user


@app.route('/', methods=['GET', 'POST'])
@login_required
def index():
    # return 'Logged in as: %s' % current_user.get_id()
    return render_template('index.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        user_id = form.name.data
        user = query_user(user_id)
        if user is not None and form.password.data == user['password']:

            curr_user = User()
            curr_user.id = user_id

            # 通过Flask-Login的login_user方法登录用户
            login_user(curr_user)
            session.permanent = True
            app.permanent_session_lifetime = timedelta(minutes=5)

            return redirect(url_for('index'))

        flash('Wrong username or password!')

    # GET 请求
    return render_template('login.html', form=form)


@app.route('/logout', methods=['GET', 'POST'])
@login_required
def logout():
    logout_user()
    return redirect("/login")


if __name__ == '__main__':
    app.run(debug=True)
