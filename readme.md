# LLM for vocabulary

## TODO
+ 解耦 generation 和 http service，发布 generation 到 jsr

## DEV

```sh
export DEEPSEEK_APIKEY='123456'
# PORT 非必须，默认监听 8000
export PORT='8080'
deno run -A ./main.ts
```

## Deploy with docker
dockerfile 里写死端口号 80，可通过 -p 修改宿主机映射，以设置容器监听的端口。

```sh
docker build -t llm4voc .
docker run --rm \
	-p 127.0.0.1:20002:80 \
	-e DEEPSEEK_APIKEY='123456' \
	llm4voc
```
