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


user_agents = {
    'Mozilla/5.0 (Linux; arm_64; Android 8.0.0; SM-A750FN) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 YaBrowser/20.4.4.76.00 SA/1 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; arm_64; Android 8.0.0; WAS-LX1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 YaBrowser/20.4.3.90.00 SA/1 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; arm_64; Android 8.1.0; BKK-L21) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 YaBrowser/19.12.0.250.00 Mobile Safari/537.36',
   'Mozilla/5.0 (Linux; arm_64; Android 8.1.0; DUA-L22) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.143 YaBrowser/19.7.3.91.00 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; arm_64; Android 8.1.0; JSN-L21) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 YaBrowser/20.4.3.90.00 SA/1 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; arm_64; Android 8.1.0; Redmi 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.117 YaBrowser/20.2.0.215.00 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; arm_64; Android 8.1.0; Redmi 6 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 YaBrowser/20.4.4.76.00 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; arm_64; Android 9; COL-L29) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 YaBrowser/20.3.0.276.00 Mobile SA/1 Safari/537.36',
    'Mozilla/5.0 (Linux; arm_64; Android 9; COL-L29) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 YaBrowser/20.4.4.76.00 SA/1 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; arm_64; Android 9; CPH1941) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 YaBrowser/20.3.2.107.00 Mobile SA/1 Safari/537.36',
    'Mozilla/5.0 (Linux; arm_64; Android 9; G8441) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 YaBrowser/20.6.0.154.00 (beta) SA/0 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; arm_64; Android 9; JSN-L21) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 YaBrowser/20.4.3.90.00 SA/1 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; arm_64; Android 9; JSN-L21) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 YaBrowser/20.4.4.76.00 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; arm_64; Android 9; LLD-L31) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 YaBrowser/20.2.5.140.00 Mobile SA/1 Safari/537.36',
    'Mozilla/5.0 (Linux; arm_64; Android 9; LLD-L31) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 YaBrowser/20.4.4.76.00 SA/1 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; arm_64; Android 9; Moto Z) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 YaBrowser/20.4.4.76.00 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; arm_64; Android 9; POT-LX1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 YaBrowser/20.4.4.76.00 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; arm_64; Android 9; Redmi 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 YaBrowser/20.4.4.76.00 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; arm_64; Android 9; Redmi 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 YaBrowser/20.4.4.76.00 SA/1 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; arm_64; Android 9; Redmi Note 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 YaBrowser/20.4.4.76.00 SA/1 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; arm_64; Android 9; Redmi Note 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 YaBrowser/20.2.5.140.00 Mobile SA/1 Safari/537.36',
    'Mozilla/5.0 (Linux; arm_64; Android 9; Redmi Note 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 YaBrowser/20.4.3.90.00 SA/1 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; arm_64; Android 9; Redmi Note 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 YaBrowser/20.4.4.76.00 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; arm_64; Android 9; Redmi Note 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 YaBrowser/20.4.3.90.00 SA/1 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; arm_64; Android 9; Redmi Note 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 YaBrowser/20.4.4.76.00 SA/1 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; arm_64; Android 9; Redmi Note 8T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 YaBrowser/20.4.3.90.00 SA/1 Mobile Safari/537.36',
}





def get_html(site):
    global proxy_list
    end = False
    while proxy_list and not end:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Linux; arm_64; Android 9; Redmi 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 YaBrowser/20.4.4.76.00 Mobile Safari/537.36'}

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


def parse_povarenok(url):
    try:

        link, end = get_html(url)
        if end:
            return -2
        soup = BeautifulSoup(link , 'html.parser')


        title_temp = soup.select('.article-header ~ h1')
        for title in title_temp:
            title = title.string

        ingr_temp = soup.select('.ingredients-bl li')
        ingredients = []
        amounts = []

        for item in ingr_temp:
            ingredient = ''
            amount = ''
            for c in item.children:
                exist = False
                try:
                    c.children
                    exist = True
                except:
                    pass
                if exist:
                    for child in c.children:
                        try:
                            if child.has_attr('href') == True:
                                for i in child.children:
                                    try:
                                        if i.has_attr('itemprop'):
                                            ingredient = i.string
                                    except:
                                        pass
                            if child.has_attr('itemprop') == True:
                                amount = child.string
                        except:
                            pass
            ingredients.append(ingredient)
            amounts.append(amount)

        imageUrl = ''
        image_temp = soup.select('.m-img > img ')
        for image in image_temp:
            if image['src'].find('gefest') != -1:
                for child in image.children:
                    try:
                        imageUrl = child['src']
                    except:
                        pass
            else:
                imageUrl = image['src']
            break
        print(imageUrl)
        tags_temp = soup.select('.article-breadcrumbs > p > span > a')
        tags = []
        cuisine = ''
        for item in tags_temp:
            if item['href'].find('category') != -1:
                tags.append(item.string.strip())
            elif item['href'].find('kitchen') != -1:
                cuisine = item.string.strip()

        portions_temp = soup.find('strong', text='Количество порций:')
        portion = ''
        if portions_temp:
            portion = portions_temp.next_sibling
        cooking_time = ''
        cooking_time_temp = soup.find('time')
        if cooking_time_temp:
            cooking_time = cooking_time_temp.string

        data = {
            'title': title,
            "imageUrl": imageUrl,
            "ingredients": ingredients,
            "amounts": amounts,
            "tags": tags,
            "portions": portion,
            "cooking_time": cooking_time,
            "site": 'povarenok',
            "cuisine": cuisine

        }

        return data

    except:
        return -1

for i in range(164692,165000):
    print(i)
    conn = psycopg2.connect(database=database, user=user, password=password, host=host, port=port)

    cursor = conn.cursor()
    cursor.execute(f"SELECT pageid FROM recepies WHERE pageid={i} AND site='povarenok'")
    conn.commit()
    if cursor.rowcount == 0:
        data = parse_povarenok(f'https://www.povarenok.ru/recipes/show/{i}/')

        if data == -2:
            break
        if data != -1:
            try:
                cursor.execute(f"INSERT INTO recepies VALUES (DEFAULT, '{data['title']}','{data['imageUrl']}',ARRAY{data['ingredients']},\
                ARRAY{data['amounts']}, ARRAY{data['tags']}, '{data['portions']}','{data['cooking_time']}','{data['site']}', {i}, '{data['cuisine']}', 'https://www.povarenok.ru/recipes/show/{i}/' );")
                conn.commit()
                cursor.execute(f"SELECT id FROM recepies WHERE pageid={i} AND site='povarenok';")
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


