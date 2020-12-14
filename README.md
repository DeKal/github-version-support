# Release

## Prerequisite
We should link our netlify to the project with
```
yarn netlify-link
```

Answer 2 questions
```
? How do you want to link this folder to a site? Enter a site ID
? What is the site ID? 2d05513c-afbb-40f6-b70e-080314eabc3a
```


## To Create new release with version
```
node scripts/release/create.js --version=3.2.20
```

## To commit new release with version
```
node scripts/release/commit --version=3.2.20
```