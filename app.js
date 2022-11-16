var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var sqlite = require('sqlite3').verbose();
var ftp = require('basic-ftp');
var { graphql, buildSchema } = require('graphql');
var { graphqlHTTP } = require('express-graphql');

example()
let db = new sqlite.Database('products.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the products database.');
    db.get("SELECT * FROM artists", (err, row) => {
        if (err) {
            console.error(err.message);
        }
        console.log(row);
    })
});

// Construct a schema, using GraphQL schema language
var schema = buildSchema(`
  type Query {
    products: [Product]
    product(id: Int!): Product
  }
  type Product {
    product_id: Int
    product_name: String
    product_subtitle: String
    product_price: String
    product_category: String
    product_picture_url: String
    }
`);

function getProducts () {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM products", (err, rows) => {
            if (err) {
                console.log(err + "error" );
                reject(err);
            }
            console.log("resolving")
            resolve(rows);
        });
    });
}

function getProduct(id) {
    console.log("getting product" + id);
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM products WHERE product_id = ?", [id], (err, row) => {
            if (err) {
                console.log(err + "error" );
                reject(err);
            }
            console.log("resolving")
            resolve(row);
        });
    });
}

getProduct(1).then((result) => {
    //console.log(result);

})



// The rootValue provides a resolver function for each API endpoint

var rootValue = {
    products:  getProducts().then((result) => {return result}),
    product: (args) => {
        return getProduct(args.id).then((result) => {return result});
    }

};

// Run the GraphQL query '{ hello }' and print out the response
graphql({
    schema,
    source: '{ product(id: 12) {product_name, product_id}  }',
    rootValue
}).then((response) => {
    console.log(JSON.stringify(response));
});

async function example() {
    const client = new ftp.Client()
    client.ftp.verbose = true
    try {
        await client.access({
            host: "172.104.159.213",
            user: "ftpuser",
            password: "FTWFTP2022!!",
            secure: false
        })
        await client.downloadTo("products.db" , "files/products1.db")
    }
    catch(err) {
        console.log(err)
    }
    client.close()
}

var app = express();
app.use('/graphql', graphqlHTTP({
    schema: schema,
    rootValue: rootValue,
    graphiql: true,
}));
app.listen(4000);
console.log('Running a GraphQL API server at http://localhost:4000/graphql');

