
const Sequelize = require('sequelize');
const {log, biglog, errorlog, colorize} = require("./out");
const {models} = require('./model');

//porque el rl?
//rl esta definido en main, por lo que les paso como parametro el rl para que lo cojan de main
exports.helpCmd = (socket, rl) => {
	log(socket, 'COMANDOS:');
      	log(socket, 'h|help - Muestra esta ayuda.');
		log(socket, 'list - Listar los quizzes existentes.');
		log(socket, 'show <id> - Muestra la pregunta y la respuesta el quiz indicado.');
		log(socket, 'add - Añadir un nuevo quiz interactivamente.');
  		log(socket, 'delete <id> - Borrar el quiz indicado.');
  		log(socket, 'edit <id> - Editar el quiz indicado.');
  		log(socket, 'test <id> - Probar el quiz indicado.');
  		log(socket, 'p|play - Jugar a preguntar aleatoriamente todos los quizzes.');	
		log(socket, 'credits - Créditos.');
		log(socket, 'q|quit - Salir del programa.');  
		rl.prompt();
};


exports.quitCmd = (socket, rl) => {
	rl.close();
	socket.end();
	
};

const makeQuestion = (rl, text) => {
	return new Sequelize.Promise((resolve, reject) => {
		rl.question(colorize(text, 'red'), answer => {
			resolve(answer.trim());
		});
	});
};
//hazme la pregunta, cuando se escriba la pregunta y de a enter ya llama a lo demás para que escribas la respuesta
//prompt tiene que estar dentro, para haber terminado ya con todas las preguntas

exports.addCmd =(socket, rl) => {

	makeQuestion(rl, 'Introduzca una pregunta: ')
	.then(q => {
		return makeQuestion(rl, 'Introduzca la respuesta ')
		.then(a=> {
			return {question: q, answer: a};
		});
	})
	.then(quiz => {
		return models.quiz.create(quiz);
	})
	.then((quiz) => {
		log(socket, ` ${colorize('Se ha añadido', 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')}  ${quiz.answer}`);
	})
	.catch(Sequelize.ValidationError, error => {
		errorlog(socket, 'El quiz es erroneo: ');
		error.errors.forEach(({message}) => errorlog(socket, message));
	})
	.catch(error => {
		errorlog(socket, error.message);
	})
	.then(() =>{
		rl.prompt();
	});
	};	


//${} sustituir lo que hay dentro por string o int
exports.listCmd = (socket, rl) => {

	models.quiz.findAll()
	.each(quiz => {
		log(socket, ` [${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
		})
	.catch(error => {
		errorlog(socket, error.message);
		})
	.then(() => {
		rl.prompt();
		});
	};

const validateId = id => {
	return new Sequelize.Promise((resolve,reject) => {
		if (typeof id === "undefined"){
			reject(new Error(`Falta el parametro <id>.`));
		} else {
			id = parseInt(id);
			if (Number.isNaN(id)) {
				reject(new Error(`El valor del parametro <id> no es un numero.`));
			} else { 
				resolve(id); 
			}
		}
	});
};

exports.showCmd = (socket, rl, id) => {
	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		if (!quiz) {
			throw new Error (`No existe un quiz asociado al id =${id}.`);
		}
		log(socket, `[${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize( '=>', 'magenta')} ${quiz.answer}`);
	})
	.catch(error => {
		errorlog(socket, error.message);
	})
	.then(() => {
		rl.prompt();
	});
};

exports.testCmd = (socket, rl, id) => {
	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		if (!quiz) {
			throw new Error (`No existe un quiz asociado al id =${id}.`);
		}
			return makeQuestion(rl, quiz.question + '  ')
	
		.then(a2 => {
			if (a2.toLowerCase().trim()  === String(quiz.answer.toLowerCase().trim())) {
			log (socket, "Su respuesta es correcta.");
			biglog(socket, 'Correcto','green');
			//log('Correcto','green');
		}
			 else { log (socket, `${colorize("Su respuesta es incorrecta.")}: `);
			 biglog(socket, 'Incorrecto','red');
			 //log('Incorrecto','red');
		 }
		rl.prompt();
		})})
	.catch(error => {
		errorlog(socket, error.message);
	})
	.then(() => {
		rl.prompt();
	});


	rl.prompt();

};

exports.playCmd = (socket, rl) => {
	let score = 0;
	let toBeResolve = [];
	
	models.quiz.findAll()
	 .each(quiz => {toBeResolve.push(quiz);
	})

	.then(() => {

	const playOne = () => {

		let longitud = toBeResolve.length;
			if (longitud === 0) {
			log(socket, 'No hay nada mas que preguntar. ');
			log(socket, 'Fin del juego. ACIERTOS: '+ score);
			log(socket, score,'magenta');
			//log(score,'magenta');
			rl.prompt();
		} else {
			
			let id = Math.trunc(Math.random()*(longitud));
			//log('id: ' + id);
			//log('quizzes1: ' + quizzes.length);
			let quiz = toBeResolve[id];


				return makeQuestion(rl, quiz.question+' ')
				.then (a2 => {
					if( a2.toLowerCase().trim()  === String(quiz.answer.toLowerCase().trim()) ) {
							score = score + 1;
							log (socket, "CORRECTO - llevas " + score + " aciertos.");
							toBeResolve.splice(id, 1);
							
							playOne();
							rl.prompt();
							
						}
						 	else { log (socket, "INCORRECTO.");
						 	log (socket, "Fin del juego. Aciertos:" + score  );
						 	log(socket, score,'magenta');
						 	//log(score,'magenta');
							 rl.prompt();
					}
				})
							 
			.catch(Sequelize.ValidationError, error => {
					errorlog(socket, 'El quiz es erróneo');
					error.errors.forEach(({ message }) => errorlog(message));
				})
	
			.catch(error => {
				errorlog(socket, error.message);
				})
			.then(() => {
				rl.prompt();
				});
			}
		}
				
				playOne();
			})
		};


exports.deleteCmd = (socket, rl, id) => {

	validateId(id)
	.then(id => models.quiz.destroy({where: {id}}))
	.catch(error => {
		errorlog(socket, error.message);
	})
	.then(() => {
		rl.prompt();
	});
};

exports.editCmd = (socket, rl, id) => {
	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		if(!quiz){
			throw new Error(`No existe un quiz asociado al id=${id}. `);
		}

		process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);
		return makeQuestion(rl, 'Introduzca la pregunta: ')
		.then(q => {
			process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)}, 0);
			return makeQuestion(rl, 'Introduzca la respuesta: ')
			.then(a => {
				quiz.question = q;
				quiz.answer = a;
				return quiz;

			});
		});
	})
	.then(quiz => {
		return quiz.save();
	})
	.then(quiz=> {
		log(socket, `Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por: ${quiz.question} $(colorize('algo', 'magenta'))`);
	})
	.catch(Sequelize.ValidationError, error =>{
		errorlog(socket, 'El quiz es erroneo:');
		error.errors.forEach(({message}) => errorlog(socket, message));
	})
	.catch(error => {
		errorlog(socket, error.message);
	})
	.then(() => {
		rl.prompt();
	});

	
};

exports.creditsCmd = rl => {
	log(socket, 'Autor de la práctica: PAULA OTERO. ', 'green');
	rl.prompt();
};
