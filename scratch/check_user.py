import sqlite3

def check_user(username):
    conn = sqlite3.connect('backend/hms.db')
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, email, full_name, role FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    conn.close()
    return user

if __name__ == "__main__":
    print(check_user('user01'))
