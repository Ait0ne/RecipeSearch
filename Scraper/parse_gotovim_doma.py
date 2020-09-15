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
            'User-Agent': 'Mozilla/5.0 (Linux; arm_64; Android 9; COL-L29) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 YaBrowser/20.3.0.276.00 Mobile SA/1 Safari/537.36'}

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
            # return r.text, True
    return r.text,  False

def parse_gotovim_doma(url):
    try:

        link, end = get_html(url)
        if end:
            return -2
        soup = BeautifulSoup(link , 'html.parser')

        title_temp = soup.select_one('.recipe  .title')
        title = title_temp.string


        image_temp = soup.select_one('.main-photo  img')
        imageUrl = 'https://gotovim-doma.ru'+image_temp['src']

        ingredients = []
        amounts = []
        ingr_temp = soup.select('tr[itemprop="recipeIngredient"] th span', )
        for ingredient in ingr_temp:
            ingredients.append(ingredient.string)
        amounts_temp = soup.select('tr[itemprop="recipeIngredient"] td strong', )
        for amount in amounts_temp:
            final =''
            for child in amount.children:
                if child.string:
                    final = final + child.string
            amounts.append(final)

        tags = []
        tags_temp = soup.select(f'.crubs a[href^="/category"]')
        for tag in tags_temp:
            tags.append(tag.string)

        portion=''
        portion_temp = soup.select_one('p[itemprop="recipeYield"] b')
        if portion_temp:
            portion = portion_temp.string
        cooking_time = ''
        cooking_time_temp = soup.select_one('meta[itemprop="totalTime"] p')
        if cooking_time_temp:
            try:
                for child in cooking_time_temp:
                    cooking_time = cooking_time + child.string
            except:
                pass
            cooking_time = cooking_time.strip()
        cuisine = ''
        cuisine_temp = soup.select_one('p[itemprop="recipeCuisine"] b a')
        if cuisine_temp:
            cuisine = cuisine_temp.string

        data = {
            'title': title,
            "imageUrl": imageUrl,
            "ingredients": ingredients,
            "amounts": amounts,
            "tags": tags,
            "portions": portion,
            "cooking_time": cooking_time,
            "site": 'gotovim-doma',
            "cuisine": cuisine

        }

        return data

    except:
        return -1


for i in range(14143,15000):
    print(i)
    conn = psycopg2.connect(database=database, user=user, password=password, host=host, port=port)

    cursor = conn.cursor()
    cursor.execute(f"SELECT pageid FROM recepies WHERE pageid={i} AND site='gotovim-doma'")
    conn.commit()
    if cursor.rowcount == 0:
        data = parse_gotovim_doma(f'https://gotovim-doma.ru/recipe/{i}-nezhnyy-biskvitnyy-pirog-s-klubnikoy-i-zavarnym-kremom')

        if data == -2:
            break
        if data != -1:
            try:
                cursor.execute(f"INSERT INTO recepies VALUES (DEFAULT, '{data['title']}','{data['imageUrl']}',ARRAY{data['ingredients']},\
                ARRAY{data['amounts']}, ARRAY{data['tags']}, '{data['portions']}','{data['cooking_time']}','{data['site']}', {i}, '{data['cuisine']}', 'https://gotovim-doma.ru/recipe/{i}-nezhnyy-biskvitnyy-pirog-s-klubnikoy-i-zavarnym-kremom' );")
                conn.commit()
                cursor.execute(f"SELECT id FROM recepies WHERE pageid={i} AND site='gotovim-doma'")
                id = cursor.fetchone()[0]
                conn.commit()
                for i, ingredient in enumerate(data['ingredients']):
                    ingr = ingredient.strip()
                    cursor.execute(f"SELECT id, counter FROM ingredients WHERE LOWER(name) LIKE LOWER('{ingr}') ORDER BY counter DESC")
                    if cursor.rowcount == 0:
                        conn.commit()
                        cursor.execute(f"INSERT INTO ingredients VALUES (DEFAULT, '{ingr}', 1);")
                        conn.commit()
                        cursor.execute(f"SELECT id, counter FROM ingredients WHERE LOWER(name) LIKE LOWER('{ingr}') ORDER BY counter DESC")
                        line = cursor.fetchone()
                        conn.commit()
                        cursor.execute(f"INSERT INTO ritemp VALUES({id}, {line[0]}, '{data['amounts'][i]}' )")
                        conn.commit()
                    else:
                        line = cursor.fetchone()
                        cursor.execute(f"UPDATE ingredients SET counter=counter+1 WHERE id={line[0]}")
                        conn.commit()
                        cursor.execute(f"INSERT INTO ritemp VALUES({id}, {line[0]}, '{data['amounts'][i]}' )")
                        conn.commit()

            except:
                pass
    cursor.close()
    conn.close()
    time.sleep(3)