# LLM for vocabulary

## TODO
+ 解耦 generation 和 http service，发布 generation 到 jsr

```sh
git clone git@github.com:AAA-voc-pifa/llm4voc.git
cd ./llm4voc
docker build -t llm4voc .
docker run --rm \
	-p 127.0.0.1:20002:8000 \
	-e deepseek_apikey='' \
	llm4voc
```
