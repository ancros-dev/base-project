package main

import (
    "log"
    "net/http"
)

func main() {
    fs := http.FileServer(http.Dir("./build/client"))
    http.Handle("/", fs)

    log.Println("Listening on :3010...")
    err := http.ListenAndServe(":3010", nil)
    if err != nil {
        log.Fatal(err)
    }
}