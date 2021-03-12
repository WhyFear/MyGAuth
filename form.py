from flask_wtf import FlaskForm, RecaptchaField
from wtforms import TextField, PasswordField, TextAreaField, StringField, validators


class LoginForm(FlaskForm):
    name = StringField('name', [validators.DataRequired()])
    password = PasswordField('password', [validators.DataRequired()])
    recaptcha = RecaptchaField()
