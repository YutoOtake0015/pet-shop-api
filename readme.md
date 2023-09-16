# セットアップ
```
git clone https://github.com/YutoOtake0015/question.git
cd question
npm i
npx prisma migrate dev
npm start
```
# 初期データ登録
```
curl -X POST http://localhost:3000/pet/createSeeds
```
