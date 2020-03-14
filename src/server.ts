#!/usr/bin/env node

import { build } from "./addon"

const { serveHTTP, publishToCentral } = require("stremio-addon-sdk")


build()
    .then(builder => {
        serveHTTP(builder.getInterface(), { port: 50420 })
    })

