var express = require('express');
var bodyParser = require('body-parser');
var sqlite = require('sqlite3').verbose();
var ftp = require('basic-ftp');
var { graphql, buildSchema } = require('graphql');
var { graphqlHTTP } = require('express-graphql');

const port = process.env.PORT || 4000

var app = express();
var cors = require('cors')
app.use(cors())




let db = new sqlite.Database('products.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the products database.');

});

// Construct a schema, using GraphQL schema language
var schema = buildSchema(`
  type Query {
    products(pageNumber: Int!): [Product]
    product(id: String!): Product
    searchProduct(name: String!): Product
  }
  type Product {
    id: String
    product_name: String
    product_sub_title: String
    product_description: String
    main_category: String
    sub_category: String
    price: String
    link: String
    overall_rating: String
    }
`);



function getProducts (pageNumber) {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM products LIMIT 10 OFFSET 10 *  ?;  ", pageNumber, (err, rows) => {
            if (err) {
                console.log(err + "error" );
                reject(err);
            }
            console.log("resolving")
            resolve(rows);
        });
    });
}

getProducts(0).then((result) => {
    console.log(result)
})

function getProductByName (name) {
    console.log("getting product" + name);
    let pattern = "%" + name + "%";
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM products WHERE product_name like ?", [pattern], (err, row) => {
            if (err) {
                console.log(err + "error" );
                reject(err);
            }
            console.log("resolving")
            resolve(row);
        });
    });
}

function getProduct(id) {
    console.log("getting product" + id);
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM products WHERE id = ?", [id], (err, row) => {
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
    products: (args) => {
        return  getProducts(args.pageNumber).then((result) => {return result})
    },

    product: (args) => {
        return getProduct(args.id).then((result) => {return result});
    },

    searchProduct: (args) => {
        return getProductByName(args.name).then((result) => {return result});
    }

};

app.use('/graphql', graphqlHTTP({
    schema: schema,
    rootValue: rootValue,
    graphiql: true,
}));

// Run the GraphQL query '{ hello }' and print out the response
/*
graphql({
    schema,
    source: '{ product(id: 12) {product_name, product_id}  }',
    rootValue
}).then((response) => {
    console.log(JSON.stringify(response));
});
*/


async function updateDatabase() {
    const client = new ftp.Client()
    client.ftp.verbose = true
    try {
        await client.access({
            host: "172.104.159.213",
            user: "ftpuser",
            password: "FTWFTP2022!!",
            secure: false
        })
        await client.downloadTo("products.db" , "files/products.db")
    }
    catch(err) {
        console.log(err)
    }
    client.close()
}
    app.post('/update', function (req, res) {
        updateDatabase().then(
            db = new sqlite.Database('products.db', (err) => {
                if (err) {
                    console.error(err.message);
                }
                console.log('Connected to the updated products database.');
                res.send("updated database on graphql server")
            })
        )
    })



app.listen(port, () => console.log(`Now browse to localhost:${port}/graphql`));
