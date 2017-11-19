/*
    Log the success message
*/
const success = desc => console.log(`${desc} : Pass`);

/*
    Log the falure message
*/
const failure = (desc, msg) => console.log(`:( ${desc} : Fail => ${msg}`);


/*
    Log a message
*/
const log = desc => console.log(desc);


/*
    Define a activity object whre all the activities functions will be added
*/
const activity = {};

/*
    Make a stack array
*/
const stack = [];

/*
    Check if stack is empty
*/
const isEmptyStack = () => stack.length === 0;


/*
    Return the top most element from the stack
*/
const stackTop = () => stack[stack.length - 1];

/*
    Context
*/
const ctx = {};


/*
    Push a new value to the stack
*/
const spush = (key, val) => stackTop()[key].push(val);


/*
    Indent the title by four spaces
*/
const indentedTitle = ctxt =>
    `${stack.map(() => '   ').join('')}${ctxt}`;


/*
  	Return a new object for the stack
*/
const newTop = title =>
  	({ title, tests: [], setup: [], teardown: [], testSuites: [] });


/*
  	Execute the topmost object from the stack in order of setup => tests => testSuits => teardown

    returns: a promise which resolves after sucessfull execution of all the processes.
*/
const execTop = () => {
    return new Promise((resolve, reject) => {
        let processes = 'setup tests testSuites teardown'.split(' ');
        executeProcesses(processes, 0).then(() => {
            resolve();
        }).catch(() => {
            reject();
        });
    });
};


/*
    Execute processes
    Artguments: {
        processes: "Array", Array of all the processes,
        counter: "Number", the current position of execution
    }

    Returns: A promise which resolvs after sucessfull execution of all the processes.
*/

const executeProcesses = (processes, counter) => {
    return new Promise((resolve, reject) => {

        /*
            check if all the processes are exected if executed resolve, 
            else start execution of the next process
        */
        let counterChecker = () => {

            counter = counter + 1;
            if(counter >= processes.length) {
                resolve();
            }
            else {
                executeProcess();
            } 
        };
        

        /*
            execute the current process and all the child fnctions belonging to the process 
        */
        let executeProcess = () => {
            let currentProcessName = processes[counter];
            executeChildProcess(currentProcessName, 0).then(() => {
                counterChecker(); 
            }).catch(() => {
                counterChecker();
            });
        };
        
        /*
            Start the execution chain
        */
        executeProcess();
    });
};


/*
    Execute the child process

    returns: a promise that resolves after execting all the sub processes of the current process.
*/

const executeChildProcess = (currentProcessName, counter) => {
    return new Promise((resolve, reject) => {
        let currentProcessExecutables = stackTop()[currentProcessName];

        /*
            Check if all of the sub processes of current process is executed,
            if done resolve, else execute the next child process
        */
        var counterChecker = () => {
            counter = counter + 1;

            if(counter >= currentProcessExecutables.length) {
                resolve();
            }
            else {
                executeActivity();
            }
        };

        /*
            execute the next subprocess, or better to say execute the activity.
        */
        var executeActivity = () => {
            var currentActivity = activity[currentProcessName];
            var executable = currentProcessExecutables[counter];
            if(currentProcessName === "tests" || currentProcessName === "testSuites") {
                currentActivity(executable).then(() => {
                    counterChecker();
                }).catch(() => {
                    counterChecker();
                });
            }
            else {
                currentActivity(executable );
                counterChecker();
            }
            
        };

        /*
            check if the current process has child execuables, if not resolve
        */
        if(currentProcessExecutables.length > 0) {
            executeActivity();
        }
        else {
            resolve();
        }
        
    });
};




/*
    execute the test suite
	Arguments: {
		title: "String", the name of a test suite,
		testSuiteFn: "Function", the function to run 
	}
*/
const execTestSuite = (title, testSuiteFn) => {
    return new Promise((resolve, reject) => {
        /*
            Log the testsuite title with indentation
        */
        log(indentedTitle(title));

        /*
            push into the stack a new object containing details of the new test
        */
        stack.push(newTop(title));

        /*
            Execute the passed testSuiteFn with current context as argument
        */
        testSuiteFn.call(ctx);   // collect testSuites, setup, teardown and it.

        /*
            Execute the first on stack testsuite and its child setup, tests, testsuits etc.
        */
        execTop().then(() => { // execute them
            /*
                Pop the topmost item from the stack which was excuted.
            */
            stack.pop();
            resolve();
        }).catch(() => {
            stack.pop();
            reject();
        });
    });	
};





/*
	Report test function.
	executes the test and runs the success or falure callback based on the outcome of the test.
	

	Arguments: {
		fn: "Function", the test function that wil be executed,
		title: "String", The title string of the test.
	}
*/
const reportTests = (fn, title) => {
  	return new  Promise((resolve, reject) => {
  		const desc = indentedTitle(title);
  		/*
			Check if the function accepts an argument if it accepts pass
			callback function as the argument.
  		*/
  		if(fn.length > 0) {
  			fn.call(ctx, (err) => {
  				if(err) {
  					failure(desc, err.message);
  					reject();
  				}
  				else {
  					success(desc);
  					resolve();
  				}
  			});
  		} 
  		else {
            /*
                Execute as a sync operation if no callback is needed.
            */
  			try {
				fn.call(ctx);
                success(desc);
				resolve();
			} catch (e) {
				failure(desc, e.message);
				reject();
			}
  		}
  	});
};

/*
  	if activity is a setup call the passed setup function
*/
activity.setup = fn => fn.call(ctx);


/*
  	if activity is a teardown call the passed teardown function
*/
activity.teardown = fn => fn.call(ctx);


/*
	if the activity is a testSuite execute the testSuite
*/

activity.testSuites = ([title, testFn]) => {
    return new Promise((resolve, reject) => {
        execTestSuite(title, testFn).then(() => {
            resolve();
        }).catch(() => {
            reject();
        });
    });
};

/*
	If the activity is a test execute the test by running report tests
*/ 


activity.tests = ([title, testFn]) => {
  	return new Promise((resolve, reject) => {
  		reportTests(testFn, title).then(() => {
  			resolve();
  		}).catch(() => {
  			reject();
  		});
  	});  		
};



/*
    Export the test function


    Takes Arguments: {
        desc: "String", test description,
        fn: "Function", test function to be called
    }
*/
export const test = (desc, fn) => spush('tests', [desc, fn]);


/*
	Export test suite function
	
	Arguments: {
		title: "String", name of the testsuite,
		testFn: "Function", the function to run for the testSuite
	}
*/

export const testSuite = (title, testfn) => {
    /*
    	check if the stack is empty.
    */
	if (isEmptyStack()) {
	  	/*
			Execute the testsuite if it is just the first one
		*/
		execTestSuite(title, testfn).then(() => {
            return;
        }).catch(() => {
            return;
        });
        return;
	}


  	/*
		if the stack is not empty push the new testsuite to the topmost stack item testsuites
	*/
	spush('testSuites', [title, testfn]);
};

/*
    export the setup function. This will push the setup to the top most item on the stack
*/
export const setup = spush.bind(null, 'setup');

/*
    Export the teardown function. This will push the teardown function to the topmost item on the stack
*/
export const teardown = spush.bind(null, 'teardown');
