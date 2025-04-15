const fs = require('fs'); // pull in the file system module

// Load our index fully into memory.
// THIS IS NOT ALWAYS THE BEST IDEA.
// We are using this for simplicity. Ideally we won't have
// synchronous operations or load entire files into memory.
const index = fs.readFileSync(`${__dirname}/../client/client.html`);
const style = fs.readFileSync(`${__dirname}/../client/style.css`);
let pokedex = require("../pokedex.json");

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

// function to handle page css
const getCss = (request,response) => {
    respond(request, response, style, 'text/css');
  }

// Get all pokemon in the pokedex
const getAllPokemon = (request,response) => {
    respond(request,response,JSON.stringify(pokedex),'application/json',200);
}

// Get all pokemon names by search
const getNames = (request,response) => {
    const { num,type,evoNum } = request.body;
    if(!num&&!type&&!evoNum){ //If everything is blank, missing params
        respond(request,response,JSON.stringify([]),'application/json',400);
        return;
    }
    let pokeList=pokedex;
    if(num){
        pokeList=searchByNum(pokeList,num);
    }
    if(type){
        pokeList=searchByType(pokeList,type);
    }
    if(evoNum){
        pokeList=searchByEvolution(pokeList,evoNum);
    }
    if(pokeList.length==0){ //If no pokemon, not found
        respond(request,response,JSON.stringify([]),'application/json',404);
        return;
    }
    let finalPokeList = [];
    for(let i=0;i<pokeList.length;i++){ //Convert to list of just names
        finalPokeList.push(pokeList[i].name);
    }
    respond(request,response,JSON.stringify(finalPokeList),'application/json',200);
}

// Get one pokemon by its exact name
const getPokeByName = (request,response) => { 
    const { name } = request.body;
    if(!name){ //If no name, missing params
        respond(request,response,JSON.stringify([]),'application/json',400);
        return;
    }
    let pokeList=searchByNameExact(pokedex,name);
    if(pokeList.length==0){ //If none found, not found
        respond(request,response,JSON.stringify([]),'application/json',404);
        return;
    }
    respond(request,response,JSON.stringify(pokeList),'application/json',200);
}

// Get all pokemon by any method
const getPokemon = (request,response) => { 
    const { num, name, type, evoNum } = request.body;

    if(!num&&!name&&!type&&!evoNum){ //If nothing filled out, missing params
        respond(request,response,JSON.stringify([]),'application/json',400);
        return;
    }
    let pokeList=pokedex;
    if(num){
        pokeList=searchByNum(pokeList,num);
    }
    if(name){
        pokeList=searchByName(pokeList,name); 
    }
    if(type){
        pokeList=searchByType(pokeList,type);
    }
    if(evoNum){
        pokeList=searchByEvolution(pokeList,evoNum);
    }
    if(pokeList.length==0){ //If none found, not found
        respond(request,response,JSON.stringify([]),'application/json',404);
        return;
    }
    respond(request,response,JSON.stringify(pokeList),'application/json',200);
}

// Add pokemon with num, name, and types
const addPokemon = (request,response) => {
    const { num, name, type1, type2 } = request.body;
    if(!num||!name||(!type1&&!type2)){ //Needs num, name, and one type or else missing params
        respond(request,response,JSON.stringify([]),'application/json',400);
        return;
    }
    if(searchByNum(pokedex,num).length>0||searchByNameExact(pokedex,name).length>0){ //If num or name already exist, updated no content
        respond(request,response,JSON.stringify([]),'application/json',204);
        return;
    }
    let newPoke={};
    newPoke.id=num;
    newPoke.name=name;
    newPoke.type=[];
    if(type1){
        newPoke.type.push(type1);
    }
    if(type2){
        newPoke.type.push(type2);
    }
    pokedex.push(newPoke);
    respond(request,response,JSON.stringify([]),'application/json',201);
}

// Adds evolution to pokemon using nums
const addEvo = (request,response) => {
    const {baby,adult} = request.body;
    if(!baby||!adult){ //Needs both nums or else missing params
        respond(request,response,JSON.stringify([]),'application/json',400);
        return;
    }
    if(searchByNum(pokedex,baby).length==0||searchByNum(pokedex,adult).length==0){ //If either num has no mon, not found
        respond(request,response,JSON.stringify([]),'application/json',404);
        return;
    }
    adultMon=searchByNum(pokedex,adult);
    adultEvo= //Converts it to the way pokedex.json handles evolutions
    {
        "num": ""+adultMon[0].id,
        "name": adultMon[0].name
    };
    for(let i=0;i<pokedex.length;i++){
        if(pokedex[i].id == baby){
            if(!pokedex[i].next_evolution){ //If baby has no evolutions, need to make it
                pokedex[i].next_evolution={};
            }else{ //Otherwise check for duplicate evolution
                for(let j=0;j<pokedex[i].next_evolution.length;j++){
                    if(adultMon[0].name.toLowerCase()===pokedex[i].next_evolution[j].name.toLowerCase()){
                        respond(request,response,JSON.stringify([]),'application/json',204);
                        return;
                    }
                }
            }
            pokedex[i].next_evolution.push(adultEvo);
            respond(request,response,JSON.stringify([]),'application/json',201);
            return;
        }
    }
    console.log("Something went wrong");
    respond(request,response,JSON.stringify([]),'application/json',204);
}

//If going to wrong page
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

// Search for pokemon using num
const searchByNum = (arr, num) => {
    newArr = [];
    for(let i=0;i<arr.length;i++){
        if(arr[i].id == num){
            newArr.push(arr[i]);
        }
    }
    return newArr;
}

// Search for pokemon using name
const searchByName = (arr, name) => {
    newArr = [];
    for(let i=0;i<arr.length;i++){
        if(arr[i].name.toLowerCase().includes(name.toLowerCase())){
            newArr.push(arr[i]);
        }
    }
    return newArr;
}

// Search for pokemon using exact name
const searchByNameExact = (arr, name) => {
    newArr = [];
    for(let i=0;i<arr.length;i++){
        if(arr[i].name.toLowerCase()===name.toLowerCase()){
            newArr.push(arr[i]);
            return newArr;
        }
    }
    return newArr;
}

// Search for pokemon using type
const searchByType = (arr,type) => {
    newArr = [];
    for(let i=0;i<arr.length;i++){
        if(arr[i].type[0].toLowerCase().includes(type.toLowerCase())){
            newArr.push(arr[i]);
        }else if(arr[i].type[1]){
            if(arr[i].type[1].toLowerCase().includes(type.toLowerCase())){
                newArr.push(arr[i]);
            }
        }
    }
    return newArr;
}

// Search for pokemon using evolution
const searchByEvolution = (arr,num) => {
    newArr = [];
    for(let i=0;i<arr.length;i++){
        if(arr[i].next_evolution){
            for(let j=0;j<arr[i].next_evolution.length;j++){ 
                if(parseInt(arr[i].next_evolution[j].num) == num){
                    newArr.push(arr[i]);
                }
            }
        }
    }
    return newArr;
}

// exports to set functions to public.
// In this syntax, you can do getCats:getCats, but if they
// are the same name, you can short handle to just getCats,
module.exports = {
  getIndex,
  getCss,
  getAllPokemon,
  getPokemon,
  getNames,
  getPokeByName,
  addPokemon,
  addEvo,
  getNotFound
};