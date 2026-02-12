# Gemini-3-Pro-Image-preview (Nano banana2) Image Generation

>  - Asynchronous processing mode, returns task ID for subsequent queries
- High-quality image generation, professional-grade image creation
- Generated image links are valid for 24 hours, please save them promptly 

<RequestExample>
  ```bash cURL theme={null}
  curl --request POST \
    --url https://api.apimart.ai/v1/images/generations \
    --header 'Authorization: Bearer <token>' \
    --header 'Content-Type: application/json' \
    --data '{
      "model": "gemini-3-pro-image-preview",
      "prompt": "A bamboo forest path under moonlight",
      "size": "1:1",
      "n": 1,
      "resolution": "1K"
    }'
  ```

  ```python Python theme={null}
  import requests

  url = "https://api.apimart.ai/v1/images/generations"

  payload = {
      "model": "gemini-3-pro-image-preview",
      "prompt": "A bamboo forest path under moonlight",
      "size": "1:1",
      "n": 1,
      "resolution": "1K"
  }

  headers = {
      "Authorization": "Bearer <token>",
      "Content-Type": "application/json"
  }

  response = requests.post(url, json=payload, headers=headers)

  print(response.json())
  ```

  ```javascript JavaScript theme={null}
  const url = "https://api.apimart.ai/v1/images/generations";

  const payload = {
    model: "gemini-3-pro-image-preview",
    prompt: "A bamboo forest path under moonlight",
    size: "1:1",
    n: 1,
    resolution: "2K"
  };

  const headers = {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
  };

  fetch(url, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(payload)
  })
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error('Error:', error));
  ```

  ```go Go theme={null}
  package main

  import (
      "bytes"
      "encoding/json"
      "fmt"
      "io/ioutil"
      "net/http"
  )

  func main() {
      url := "https://api.apimart.ai/v1/images/generations"

      payload := map[string]interface{}{
          "model":      "gemini-3-pro-image-preview",
          "prompt":     "A bamboo forest path under moonlight",
          "size":       "1:1",
          "n":          1,
          "resolution": "1K",
      }

      jsonData, _ := json.Marshal(payload)

      req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
      req.Header.Set("Authorization", "Bearer <token>")
      req.Header.Set("Content-Type", "application/json")

      client := &http.Client{}
      resp, err := client.Do(req)
      if err != nil {
          panic(err)
      }
      defer resp.Body.Close()

      body, _ := ioutil.ReadAll(resp.Body)
      fmt.Println(string(body))
  }
  ```

  ```java Java theme={null}
  import java.net.http.HttpClient;
  import java.net.http.HttpRequest;
  import java.net.http.HttpResponse;
  import java.net.URI;

  public class Main {
      public static void main(String[] args) throws Exception {
          String url = "https://api.apimart.ai/v1/images/generations";

          String payload = """
          {
            "model": "gemini-3-pro-image-preview",
            "prompt": "A bamboo forest path under moonlight",
            "size": "1:1",
            "n": 1,
            "resolution": "1K"
          }
          """;

          HttpClient client = HttpClient.newHttpClient();
          HttpRequest request = HttpRequest.newBuilder()
              .uri(URI.create(url))
              .header("Authorization", "Bearer <token>")
              .header("Content-Type", "application/json")
              .POST(HttpRequest.BodyPublishers.ofString(payload))
              .build();

          HttpResponse<String> response = client.send(request,
              HttpResponse.BodyHandlers.ofString());

          System.out.println(response.body());
      }
  }
  ```

  ```php PHP theme={null}
  <?php

  $url = "https://api.apimart.ai/v1/images/generations";

  $payload = [
      "model" => "gemini-3-pro-image-preview",
      "prompt" => "A bamboo forest path under moonlight",
      "size" => "1:1",
      "n" => 1,
      "resolution" => "2K"
  ];

  $ch = curl_init($url);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($ch, CURLOPT_POST, true);
  curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
  curl_setopt($ch, CURLOPT_HTTPHEADER, [
      "Authorization: Bearer <token>",
      "Content-Type: application/json"
  ]);

  $response = curl_exec($ch);
  curl_close($ch);

  echo $response;
  ?>
  ```

  ```ruby Ruby theme={null}
  require 'net/http'
  require 'json'
  require 'uri'

  url = URI("https://api.apimart.ai/v1/images/generations")

  payload = {
    model: "gemini-3-pro-image-preview",
    prompt: "A bamboo forest path under moonlight",
    size: "1:1",
    n: 1,
    resolution: "2K"
  }

  http = Net::HTTP.new(url.host, url.port)
  http.use_ssl = true

  request = Net::HTTP::Post.new(url)
  request["Authorization"] = "Bearer <token>"
  request["Content-Type"] = "application/json"
  request.body = payload.to_json

  response = http.request(request)
  puts response.body
  ```

  ```swift Swift theme={null}
  import Foundation

  let url = URL(string: "https://api.apimart.ai/v1/images/generations")!

  let payload: [String: Any] = [
      "model": "gemini-3-pro-image-preview",
      "prompt": "A bamboo forest path under moonlight",
      "size": "1:1",
      "n": 1,
      "resolution": "1K"
  ]

  var request = URLRequest(url: url)
  request.httpMethod = "POST"
  request.setValue("Bearer <token>", forHTTPHeaderField: "Authorization")
  request.setValue("application/json", forHTTPHeaderField: "Content-Type")
  request.httpBody = try? JSONSerialization.data(withJSONObject: payload)

  let task = URLSession.shared.dataTask(with: request) { data, response, error in
      if let error = error {
          print("Error: \(error)")
          return
      }
      
      if let data = data, let responseString = String(data: data, encoding: .utf8) {
          print(responseString)
      }
  }

  task.resume()
  ```

  ```csharp C# theme={null}
  using System;
  using System.Net.Http;
  using System.Text;
  using System.Threading.Tasks;

  class Program
  {
      static async Task Main(string[] args)
      {
          var url = "https://api.apimart.ai/v1/images/generations";

          var payload = @"{
              ""model"": ""gemini-3-pro-image-preview"",
              ""prompt"": ""A bamboo forest path under moonlight"",
              ""size"": ""1:1"",
              ""n"": 1,
              ""resolution"": ""2K""
          }";

          using var client = new HttpClient();
          client.DefaultRequestHeaders.Add("Authorization", "Bearer <token>");

          var content = new StringContent(payload, Encoding.UTF8, "application/json");
          var response = await client.PostAsync(url, content);
          var result = await response.Content.ReadAsStringAsync();

          Console.WriteLine(result);
      }
  }
  ```

  ```c C theme={null}
  #include <stdio.h>
  #include <curl/curl.h>

  int main(void) {
      CURL *curl;
      CURLcode res;

      curl_global_init(CURL_GLOBAL_DEFAULT);
      curl = curl_easy_init();

      if(curl) {
          const char *url = "https://api.apimart.ai/v1/images/generations";
          const char *payload = "{"
              "\"model\":\"gemini-3-pro-image-preview\","
              "\"prompt\":\"A bamboo forest path under moonlight\","
              "\"size\":\"1:1\","
              "\"n\":1,"
              "\"resolution\":\"2K\""
          "}";

          struct curl_slist *headers = NULL;
          headers = curl_slist_append(headers, "Authorization: Bearer <token>");
          headers = curl_slist_append(headers, "Content-Type: application/json");

          curl_easy_setopt(curl, CURLOPT_URL, url);
          curl_easy_setopt(curl, CURLOPT_POSTFIELDS, payload);
          curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);

          res = curl_easy_perform(curl);

          if(res != CURLE_OK) {
              fprintf(stderr, "curl_easy_perform() failed: %s\n",
                      curl_easy_strerror(res));
          }

          curl_slist_free_all(headers);
          curl_easy_cleanup(curl);
      }

      curl_global_cleanup();
      return 0;
  }
  ```

  ```objectivec Objective-C theme={null}
  #import <Foundation/Foundation.h>

  int main(int argc, const char * argv[]) {
      @autoreleasepool {
          NSURL *url = [NSURL URLWithString:@"https://api.apimart.ai/v1/images/generations"];
          
          NSDictionary *payload = @{
              @"model": @"gemini-3-pro-image-preview",
              @"prompt": @"A bamboo forest path under moonlight",
              @"size": @"1:1",
              @"n": @1,
              @"resolution": @"2K"
          };
          
          NSError *error;
          NSData *jsonData = [NSJSONSerialization dataWithJSONObject:payload
                                                            options:0
                                                              error:&error];
          
          NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:url];
          [request setHTTPMethod:@"POST"];
          [request setValue:@"Bearer <token>" forHTTPHeaderField:@"Authorization"];
          [request setValue:@"application/json" forHTTPHeaderField:@"Content-Type"];
          [request setHTTPBody:jsonData];
          
          NSURLSessionDataTask *task = [[NSURLSession sharedSession] 
              dataTaskWithRequest:request
              completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
                  if (error) {
                      NSLog(@"Error: %@", error);
                      return;
                  }
                  NSString *result = [[NSString alloc] initWithData:data 
                                                          encoding:NSUTF8StringEncoding];
                  NSLog(@"%@", result);
              }];
          
          [task resume];
          [[NSRunLoop mainRunLoop] run];
      }
      return 0;
  }
  ```

  ```ocaml OCaml theme={null}
  (* Requires cohttp and yojson libraries *)
  open Lwt
  open Cohttp
  open Cohttp_lwt_unix

  let url = "https://api.apimart.ai/v1/images/generations"

  let payload = {|{
    "model": "gemini-3-pro-image-preview",
    "prompt": "A bamboo forest path under moonlight",
    "size": "1:1",
    "n": 1,
    "resolution": "1K"
  }|}

  let () =
    let headers = Header.init ()
      |> fun h -> Header.add h "Authorization" "Bearer <token>"
      |> fun h -> Header.add h "Content-Type" "application/json"
    in
    let body = Cohttp_lwt.Body.of_string payload in
    
    let response = Client.post ~headers ~body (Uri.of_string url) >>= fun (resp, body) ->
      body |> Cohttp_lwt.Body.to_string >|= fun body_str ->
      print_endline body_str
    in
    Lwt_main.run response
  ```

  ```dart Dart theme={null}
  import 'dart:convert';
  import 'package:http/http.dart' as http;

  void main() async {
    final url = Uri.parse('https://api.apimart.ai/v1/images/generations');
    
    final payload = {
      'model': 'gemini-3-pro-image-preview',
      'prompt': 'A bamboo forest path under moonlight',
      'size': '1:1',
      'n': 1,
      'resolution': '1K'
    };
    
    final response = await http.post(
      url,
      headers: {
        'Authorization': 'Bearer <token>',
        'Content-Type': 'application/json'
    },
      body: jsonEncode(payload),
    );
    
    print(response.body);
  }
  ```

  ```r R theme={null}
  library(httr)
  library(jsonlite)

  url <- "https://api.apimart.ai/v1/images/generations"

  payload <- list(
    model = "gemini-3-pro-image-preview",
    prompt = "A bamboo forest path under moonlight",
    size = "1:1",
    n = 1,
    resolution = "1K"
  )

  response <- POST(
    url,
    add_headers(
      Authorization = "Bearer <token>",
      `Content-Type` = "application/json"
    ),
    body = toJSON(payload, auto_unbox = TRUE),
    encode = "raw"
  )

  cat(content(response, "text"))
  ```
</RequestExample>

<ResponseExample>
  ```json 200 theme={null}
  {
    "code": 200,
    "data": [
      {
        "status": "submitted",
        "task_id": "task_01K8SGYNNNVBQTXNR4MM964S7K"
      }
    ]
  }
  ```

  ```json 400 theme={null}
  {
    "error": {
      "code": 400,
      "message": "Invalid request parameters",
      "type": "invalid_request_error"
    }
  }
  ```

  ```json 401 theme={null}
  {
    "error": {
      "code": 401,
      "message": "Authentication failed, please check your API key",
      "type": "authentication_error"
    }
  }
  ```

  ```json 402 theme={null}
  {
    "error": {
      "code": 402,
      "message": "Insufficient account balance, please recharge",
      "type": "payment_required"
    }
  }
  ```

  ```json 403 theme={null}
  {
    "error": {
      "code": 403,
      "message": "Access forbidden, you do not have permission to access this resource",
      "type": "permission_error"
    }
  }
  ```

  ```json 429 theme={null}
  {
    "error": {
      "code": 429,
      "message": "Too many requests, please try again later",
      "type": "rate_limit_error"
    }
  }
  ```

  ```json 500 theme={null}
  {
    "error": {
      "code": 500,
      "message": "Internal server error, please try again later",
      "type": "server_error"
    }
  }
  ```

  ```json 502 theme={null}
  {
    "error": {
      "code": 502,
      "message": "Gateway error, server temporarily unavailable",
      "type": "bad_gateway"
    }
  }
  ```
</ResponseExample>

## Authorizations

<ParamField header="Authorization" type="string" required>
  All APIs require authentication using Bearer Token

  Get API Key:

  Visit [API Key Management Page](https://apimart.ai/console/token) to obtain your API Key

  Add to request header:

  ```
  Authorization: Bearer YOUR_API_KEY
  ```
</ParamField>

## Body

<ParamField body="model" type="string" default="gemini-3-pro-image-preview" required>
  Image generation model name

  Example: `"gemini-3-pro-image-preview"`
</ParamField>

<ParamField body="prompt" type="string" required>
  Text description for image generation
</ParamField>

<ParamField body="size" type="string">
  Image generation size

  Supported formats:

  * Ratios: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`
</ParamField>

<ParamField body="n" type="integer">
  Number of images to generate

  Fixed at 1

  **⚠️ Note:** Must be a pure number (e.g. `1`), do not add quotes, otherwise it will error
</ParamField>

<ParamField body="resolution" type="string">
  Output image resolution

  Supported values:

  * `1K` - 1K resolution (default)
  * `2K` - 2K resolution
  * `4K` - 4K resolution

  **⚠️ Note:** Generating 4K images with base64 format takes longer processing time
</ParamField>

<ParamField body="image_urls" type="array">
  List of reference image URLs for image-to-image or image editing

  **💡 Quick Fill (Try it area):**

  1. Click "+ Add an item" to add an image URL
  2. Enter the complete image URL address or base64 data

  <Expandable title="Detailed field description">
    <ParamField body="url" type="string" required>
      Image URL address

      Supports two formats:

      **1. Complete image URL address**

      * Publicly accessible image URL (http\:// or https\://)
      * Example: `https://example.com/image.jpg`

      **2. Base64 encoded format**

      * **Must use complete Data URI format**
      * Format: `data:image/{format};base64,{base64data}`
      * Supported image formats: jpeg, png, webp, etc.
      * Example: `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABg...`
      * ⚠️ Note: Must include the `data:image/jpeg;base64,` prefix

      **Limitations:**

      * Single image must not exceed 10MB
      * Supported formats: .jpeg, .jpg, .png, .webp
    </ParamField>
  </Expandable>

  **Limit:** Maximum 14 images
</ParamField>

## Response

<ResponseField name="code" type="integer">
  Response status code
</ResponseField>

<ResponseField name="data" type="array">
  Response data array

  <Expandable title="Properties">
    <ResponseField name="status" type="string">
      Task status

      * `submitted` - Submitted
    </ResponseField>

    <ResponseField name="task_id" type="string">
      Unique task identifier
    </ResponseField>
  </Expandable>
</ResponseField>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://docs.apimart.ai/llms.txt