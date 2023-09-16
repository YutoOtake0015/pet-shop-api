# 補足

DB に PostgreSQL を使用しています。</br>
セットアップ時、`npx prisma migrate dev`実行前に、 </br>
作成した DB への接続情報を記述した".env"ファイルをルートディレクトリ配置してください。

- 参考

```.env
DATABASE_URL = "postgresql://postgres:PASSWORD@localhost:5432/pet_shop"
```

# セットアップ

```
git clone https://github.com/YutoOtake0015/pet-shop-api.git
cd pet-shop-api
npm i
```

上記補足内容の実施

```
npx prisma migrate dev
```

Do you want to continue? All data will be lost. › (y/N)　 → `y`

```
npm start
```

- 補足</br>
  `npx prisma migrate dev`実行時、仮データが作成されます。
