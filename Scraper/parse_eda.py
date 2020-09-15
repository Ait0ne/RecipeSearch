from bs4 import BeautifulSoup
import requests
import re
import time
import psycopg2
import random
import os


from dotenv import load_dotenv
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)

database = os.getenv('DATABASE')
user = os.getenv('USER')
port = os.getenv('PORT')
password = os.getenv('PASSWORD')
host = os.getenv('HOST')

def get_proxy_list():
    r = requests.get('https://api.proxyscrape.com/?request=getproxies&proxytype=http&timeout=10000&country=all&ssl=yes&anonymity=elite')
    proxy_list = r.text.split('\r\n')
    for proxy in proxy_list:
        if proxy == '':
            proxy_list.remove(proxy)
    return proxy_list
proxy_list = get_proxy_list()


def get_html(site):
    global proxy_list
    end = False
    while proxy_list and not end:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Linux; arm_64; Android 9; CPH1941) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 YaBrowser/20.3.2.107.00 Mobile SA/1 Safari/537.36'}

        proxy = proxy_list[int(random.random()*len(proxy_list))]
        print(proxy)
        print(len(proxy_list))
        try:
            proxies = {
                'http': '183.166.111.108:9999',
                'https': proxy
            }

            r = requests.get(site, headers=headers, proxies=proxies, timeout=10)
            end = True
            print(2)
        except:
            print(1)
            proxy_list.remove(proxy)
        if len(proxy_list) == 1:
            proxy_list = get_proxy_list()
    return r.text,  False

def parse_eda(url):
        link, end = get_html(url)
        if end:
            return -2
        soup = BeautifulSoup(link , 'html.parser')
        title_temp = soup.select_one('h1')
        title = title_temp.string.replace('\xa0', ' ')
        ingredients = []
        ingredient_temp = soup.select('.ingredient-item .ingredient')
        for ingredient in ingredient_temp:
            ingredients.append(ingredient.string)
        amounts = []
        amounts_temp = soup.select('.ingredient-item .amount')
        for amount in amounts_temp:
            amounts.append(amount.string)

        script = soup.find_all('script', type='application/ld+json')
        cuisine = ''
        for s in script:
            for child in s.children:
                str = child.string
                start = str.find('recipeCuisine')
                end = str[start:].find(',')
                str = str[start:start+end]
                cuisine = str.split(':')[1].strip('"')

        data = {
            'title': title,
            "ingredients": ingredients,
            "amounts": amounts,
            "cuisine": cuisine

        }
        print(data)
        return data

for i in range(20000,22000):
    print(i)
    conn = psycopg2.connect(database=database, user=user, password=password, host=host, port=port)
    cursor = conn.cursor()
    cursor.execute(f"SELECT pageid FROM eda WHERE pageid={i}")
    conn.commit()
    if cursor.rowcount == 0:
        data = parse_eda(f'https://eda.ru/recepty/vypechka-deserty/ananasovij-salat-{i}')

        if data == -2:
            break
        if data != -1:
             try:
                cursor.execute(f"INSERT INTO eda VALUES (DEFAULT, '{data['title']}',ARRAY{data['ingredients']},\
                ARRAY{data['amounts']}, '{data['cuisine']}', {i} );")
                conn.commit()
             except:
                 pass
    cursor.close()
    conn.close()
    time.sleep(3)