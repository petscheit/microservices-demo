---
noteId: "7fc030602e2911eabb58e10a02f731c6"
tags: []

---

# Shipping Service

The Shipping service provides price quote, tracking IDs, and the impression of order fulfillment & shipping processes.

## Local

Run the following command to restore dependencies to `vendor/` directory:

    dep ensure --vendor-only

## Build

From repository root, run:

```
docker build --file src/shippingservice/Dockerfile .
```

## Test

```
go test .
```
