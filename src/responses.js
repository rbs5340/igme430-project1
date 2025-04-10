const fs = require('fs'); // pull in the file system module

// Load our index fully into memory.
// THIS IS NOT ALWAYS THE BEST IDEA.
// We are using this for simplicity. Ideally we won't have
// synchronous operations or load entire files into memory.
const index = fs.readFileSync(`${__dirname}/../client/client.html`);
const style = fs.readFileSync(`${__dirname}/../client/style.css`);
let pokedex = require("../pokedex.json");

let jsonUsers = {
    users:[]
};
let userCount=0;

// function to send response
const respond = (request, response, content, type, status=200) => {
    response.writeHead(status, {
        'Content-Type': type,
        'Content-Length': Buffer.byteLength(content, 'utf8'),
      });
    if(request.method!=='HEAD'){
        response.write(content);
    }
    response.end();
  // set status code (200 success) and content type
  
  // write the content string or buffer to response
  
  // send the response to the client
};

// function to handle the index page
const getIndex = (request, response) => {
  respond(request, response, index, 'text/html');
};

const getCss = (request,response) => {
  respond(request, response, style, 'text/css');
}

const getUsers = (request,response) => {
    respond(request, response, JSON.stringify(jsonUsers), 'application/json', 200);
}

const getAllPokemon = (request,response) => {
    respond(request,response,JSON.stringify(pokedex),'application/json',200);
}

const getPokemon = (request,response) => {
    const { name, type } = request.body;
    let pokeList=pokedex;
    if(name){
        console.log("Name:" + name);
        var nameList=[];
        for(let i=0;i<pokeList.length;i++){
            if(pokeList[i].name.toLowerCase().includes(name.toLowerCase())){
                nameList.push(pokeList[i]);
            }
        }
        pokeList=nameList;
        //console.log("Names: "+JSON.stringify(pokeList));    
    }
    if(type){
        //console.log("TestLog: "+pokeList[0].type[0].toLowerCase());
        //console.log("Type: " + type.toLowerCase());
        var typeList=[];
        for(let i=0;i<pokeList.length;i++){
            if(pokeList[i].type[0].toLowerCase().includes(type.toLowerCase())){
                typeList.push(pokeList[i]);
            }else if(pokeList[i].type[1]){
                if(pokeList[i].type[1].toLowerCase().includes(type.toLowerCase())){
                    typeList.push(pokeList[i]);
                }
            }
        }
        pokeList=typeList;
        //console.log("Types: "+JSON.stringify(pokeList));
    }
    respond(request,response,JSON.stringify(pokeList),'application/json',200);
}
    

const addUser = (request,response) => {
    const { name, age } = request.body;
    console.log("Name: "+name);
    if(!name||!age){ //If name or age aren't filled
        let responseObject = {
            title: "Bad Request",
            message: "Name and age are both required",
            id: "addUserMissingParams"
           };
         
        respond(request, response, JSON.stringify(responseObject), 'application/json', 400);
    }else{
        let done=false;
        if(userCount>0){
            debugger
            for(let i=0;i<userCount;i++){
                if(jsonUsers.users[i].name==name){
                    let responseObject = {
                        title: "Updated (No Content)"
                       };
                    respond(request, response, JSON.stringify(responseObject), 'application/json', 204);
                    done=true;
                    break;
                }
            }
        }
        if(!done){
            jsonUsers.users.push({
                name: name,
                age: age
            })
            userCount++;
            let responseObject = {
                title: "Created",
                message: "Created Succesfully",
            };
            respond(request, response, JSON.stringify(responseObject), 'application/json', 201);
        }
    }
    

}

const getNotFound = (request,response) => {
    if(request.method==='HEAD'){ //If HEAD request
        let responseObject = {
            title: "Not Found"
        }
        respond(request, response, JSON.stringify(responseObject), 'application/json', 404);
    }else{
        let responseObject = {
            title: "Not Found",
            message: "The page you are looking for was not found",
            id: "notFound"
           };
       
         respond(request, response, JSON.stringify(responseObject), 'application/json', 404);
    }
    
}

const getObjectByValue = function (array, key, value) {
    return array.filter(function (object) {
        return object[key].toLowerCase() === value.toLowerCase();
    });
};

// exports to set functions to public.
// In this syntax, you can do getCats:getCats, but if they
// are the same name, you can short handle to just getCats,
module.exports = {
  getIndex,
  getCss,
  getUsers,
  addUser,
  getAllPokemon,
  getPokemon,
  getNotFound
};