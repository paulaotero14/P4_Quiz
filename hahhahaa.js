

//modulo de node
const fs = require("fs");

//constante con el fichero que voy a crear
const DB_FILENAME = "quizzes.json";

//variable quizzes almacen de preguntas y respuestas
let quizzes = [
{
	question : "Capital de Italia", 
	answer: "Roma"
},
{
	question : "Capital de Francia", 
	answer: "Paris"
},
{
	question : "Capital de España", 
	answer: "Madrid"
},
{
	question : "Capital de Portugal", 
	answer: "Lisboa"
}
];

//enoent, que no existe el fichero
const load = () => {
	fs.readFile(DB_FILENAME, (err, data) => {
		if (err) {
			if (err.code ==="ENOENT") {
				save();
				return;
			}
			throw err;
		}

		let json = JSON.parse(data);

		if (json) {
			quizzes = json;
		}
	});
};


const save = () => {

	fs.writeFile(DB_FILENAME, JSON.stringify(quizzes), err => {if (err) throw err; });
};

//En todos los metodos, cambio las funciones a exportar
exports.count = () => quizzes.length;

//trim: quitar espacios por delante y por detras
exports.add = (question, answer ) => {

	quizzes.push({
		question: (question || "").trim(),
		answer: (answer || "").trim()
	});
	save();
};

// id empieza en 0
//splice metodo que determina que solo quitamos un elemento, y cambiamos la pregunta y respuesta
exports.update = (id, question, answer) => {
	const quiz =quizzes[id];
	if (typeof quiz === "undefined") {
		throw new Error('El valor del parametro id no es valido');
	}
	quizzes.splice(id, 1, {
		question: (question || "").trim(),
		answer: (answer || "").trim()
	});
	save();
};

//no solo devuelve quizzes, porque clonamos el valor, pasamos una copia de los datos que hay en el 
//array en vez de el array de verdad porque no sabemos que van a hacer con los atos
exports.getAll = () => JSON.parse(JSON.stringify(quizzes));


exports.getByIndex = id => {

	const quiz = quizzes[id];
	if (typeof quiz == "undefined") {
		throw new Error ('El valor del parametro id no es valido');
	}
	return JSON.parse(JSON.stringify(quiz));
};

exports.deleteByIndex = id => {
	const quiz = quizzes[id];
	if (typeof quiz == "undefined") {
		throw new Error ('El valor del parametro id no es valido');
	}
	quizzes.splice(id,1);
	save();
};


load();