var name="Juyee";
//console.log(name);

let age=22;
const hasHobbies= true;

const summarizeUser = (userName,userAge,userHashobbies) => {
    return (
        'Name is: ' +
        userName + 
        ', age is: ' +
        userAge +
        ' and hobbies are '+
        userHashobbies
    );

};
//console.log(summarizeUser("Juyee",22,true))

const person = {
    name: 'Juyee',
    age:22,
    greet() {
        console.log("Hello there, my name is " + this.name + " and this is my first node.js program");
    }
};
//console.log(person.greet());

const hobbies = ["Dancing","Writing"];

// for(let hobby of hobbies) {
//     console.log(hobby)
// }

//console.log(hobbies.map(hobby => "Hobbies: " + hobby));

const copiedArray = [...hobbies];
//console.log(copiedArray);

const printName = ({ name }) => {
    console.log(name);
}

//printName(person);

const fetchData = () => {
    const promise = new Promise((resolve,reject) => {
        setTimeout(() => {
            resolve('Done!');
        },1500);
    });
    return promise;
};

setTimeout(() => {
    console.log("Timer is done!");
    fetchData()
        .then(text => {
            console.log(text);
        })
},2000);
