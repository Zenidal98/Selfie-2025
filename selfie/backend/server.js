const express = require ('express');
const cors = require ('cors');
const mongoose = require ('mongoose');
const dotenv = require ('dotenv');

const app = express();

app.get("/", (req,res) => {
    res.send("Server pronto");
})

app.listen(5000, () => {
    console.log("Server attivato sulla porta 5000");
});

