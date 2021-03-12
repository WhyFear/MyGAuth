from flask_login import UserMixin
from dotenv import load_dotenv
import os

load_dotenv(encoding='utf8')


class User(UserMixin):
    pass


users = [
    {'id': os.getenv("USER_ID"), 'username': os.getenv("USERNAME"), 'password': os.getenv("PASSWORD")},
]


def query_user(user_id):
    for user in users:
        if user_id == user['id']:
            return user
