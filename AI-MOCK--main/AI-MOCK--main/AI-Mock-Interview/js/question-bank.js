const QuestionBank=(()=>{const Q=[
// DSA
{id:'dsa1',d:'DSA',s:'Arrays',df:1,q:'What is an array? Explain its types.',k:['array','contiguous','memory','index','one-dimensional','multi-dimensional'],a:'An array is a linear data structure storing elements in contiguous memory locations, accessed by index. Types: 1D, 2D, and multi-dimensional arrays. Time complexity for access is O(1), insertion/deletion O(n).',h:'Think about how elements are stored in memory.',f:['What is the time complexity of array operations?','How does array differ from linked list?']},
{id:'dsa2',d:'DSA',s:'Arrays',df:2,q:'Explain the difference between static and dynamic arrays.',k:['static','dynamic','fixed size','resizable','allocation'],a:'Static arrays have fixed size determined at compile time. Dynamic arrays can resize at runtime, typically doubling capacity when full. Examples: C arrays (static), ArrayList in Java, vector in C++ (dynamic).',h:'Think about memory allocation.',f:['What is amortized time complexity of dynamic array insertion?']},
{id:'dsa3',d:'DSA',s:'Linked List',df:1,q:'What is a linked list? What are its types?',k:['node','pointer','singly','doubly','circular','dynamic'],a:'A linked list is a linear data structure where elements (nodes) are linked using pointers. Each node has data and a pointer to the next node. Types: Singly, Doubly, and Circular linked lists.',h:'Think about nodes and pointers.',f:['When would you use linked list over array?']},
{id:'dsa4',d:'DSA',s:'Stack',df:1,q:'Explain stack data structure and its operations.',k:['LIFO','push','pop','peek','top','last in first out'],a:'Stack follows LIFO principle. Operations: push (add to top), pop (remove from top), peek (view top), isEmpty. Used in function calls, expression evaluation, undo operations. O(1) for all operations.',h:'Think LIFO - Last In First Out.',f:['Give real-world examples of stack.']},
{id:'dsa5',d:'DSA',s:'Queue',df:1,q:'What is a queue? Explain its types.',k:['FIFO','enqueue','dequeue','front','rear','circular','priority'],a:'Queue follows FIFO principle. Operations: enqueue (add to rear), dequeue (remove from front). Types: Simple, Circular, Priority, Double-ended (Deque). Used in BFS, scheduling, buffering.',h:'Think FIFO - First In First Out.',f:['Explain priority queue and its implementation.']},
{id:'dsa6',d:'DSA',s:'Tree',df:2,q:'What is a Binary Search Tree? Explain its properties.',k:['BST','left','right','root','sorted','inorder','search','O(log n)'],a:'BST is a binary tree where left subtree has smaller values and right subtree has larger values than root. Inorder traversal gives sorted sequence. Average case O(log n) for search, insert, delete.',h:'Left is smaller, right is larger.',f:['What happens when BST becomes skewed?']},
{id:'dsa7',d:'DSA',s:'Sorting',df:1,q:'Explain Quick Sort algorithm and its time complexity.',k:['pivot','partition','divide and conquer','O(n log n)','recursive','in-place'],a:'Quick Sort uses divide-and-conquer. Pick a pivot, partition array so elements smaller than pivot go left, larger go right. Recursively sort sub-arrays. Average O(n log n), worst O(n²).',h:'Think about choosing a pivot element.',f:['How to handle worst case in quicksort?']},
{id:'dsa8',d:'DSA',s:'Graph',df:2,q:'Explain BFS and DFS traversal algorithms.',k:['breadth first','depth first','queue','stack','visited','traversal','level order'],a:'BFS explores level by level using queue - good for shortest path. DFS goes deep using stack/recursion - good for topological sort, cycle detection. Both O(V+E) time complexity.',h:'BFS uses queue, DFS uses stack.',f:['When would you use BFS over DFS?']},
{id:'dsa9',d:'DSA',s:'Dynamic Programming',df:3,q:'What is Dynamic Programming? Explain with an example.',k:['overlapping subproblems','optimal substructure','memoization','tabulation','fibonacci'],a:'DP solves complex problems by breaking into overlapping subproblems, storing results to avoid recomputation. Two approaches: top-down (memoization) and bottom-up (tabulation). Example: Fibonacci - instead of O(2^n) recursion, DP gives O(n).',h:'Think about storing results of subproblems.',f:['Difference between memoization and tabulation?']},
{id:'dsa10',d:'DSA',s:'Hashing',df:2,q:'What is hashing? Explain collision handling techniques.',k:['hash function','hash table','collision','chaining','open addressing','load factor'],a:'Hashing maps keys to indices using hash function for O(1) average lookup. Collision handling: Chaining (linked lists at each index) and Open Addressing (linear probing, quadratic probing, double hashing).',h:'Think about mapping keys to array indices.',f:['What makes a good hash function?']},
// DBMS
{id:'db1',d:'DBMS',s:'Basics',df:1,q:'What is DBMS? Explain its advantages over file system.',k:['database management system','redundancy','consistency','security','concurrent','integrity'],a:'DBMS is software to store, manage, and retrieve data efficiently. Advantages over file system: reduced redundancy, data consistency, security, concurrent access, data integrity, backup/recovery, query language support.',h:'Think about problems with flat files.',f:['What are different types of DBMS?']},
{id:'db2',d:'DBMS',s:'Normalization',df:2,q:'Explain normalization and its forms.',k:['1NF','2NF','3NF','BCNF','redundancy','functional dependency','anomalies'],a:'Normalization reduces redundancy and anomalies. 1NF: atomic values. 2NF: no partial dependency. 3NF: no transitive dependency. BCNF: every determinant is a candidate key. Prevents insert, update, delete anomalies.',h:'Each form removes a type of dependency.',f:['When would you denormalize?']},
{id:'db3',d:'DBMS',s:'SQL',df:1,q:'Explain different types of SQL joins.',k:['inner join','left join','right join','full outer join','cross join','self join'],a:'INNER JOIN: matching rows from both tables. LEFT JOIN: all from left + matching from right. RIGHT JOIN: all from right + matching from left. FULL OUTER JOIN: all rows from both. CROSS JOIN: cartesian product.',h:'Think about Venn diagrams.',f:['Write a query using self join.']},
{id:'db4',d:'DBMS',s:'Transactions',df:2,q:'What are ACID properties in database?',k:['atomicity','consistency','isolation','durability','transaction','commit','rollback'],a:'ACID ensures reliable transactions. Atomicity: all or nothing. Consistency: valid state transitions. Isolation: concurrent transactions dont interfere. Durability: committed changes persist even after failure.',h:'Each letter stands for a property.',f:['Explain isolation levels.']},
{id:'db5',d:'DBMS',s:'Indexing',df:2,q:'What is indexing? Explain types of indexes.',k:['B-tree','hash index','clustered','non-clustered','primary','secondary','performance'],a:'Index is a data structure improving query speed. Types: Clustered (reorders table data, one per table), Non-clustered (separate structure, multiple per table). Implementations: B-tree (range queries), Hash (equality).',h:'Think of a book index.',f:['When should you NOT use indexes?']},
{id:'db6',d:'DBMS',s:'SQL',df:1,q:'Explain GROUP BY and HAVING clauses.',k:['aggregate','group','having','where','count','sum','avg'],a:'GROUP BY groups rows sharing a property for aggregate functions (COUNT, SUM, AVG, MAX, MIN). HAVING filters groups after aggregation, while WHERE filters rows before grouping.',h:'WHERE filters rows, HAVING filters groups.',f:['Write a query to find departments with more than 5 employees.']},
// OS
{id:'os1',d:'OS',s:'Process',df:1,q:'What is the difference between process and thread?',k:['process','thread','memory','lightweight','shared','independent','context switch'],a:'Process is an independent program with own memory space. Thread is a lightweight unit within process sharing memory. Context switching between threads is faster. Processes are isolated; threads share heap but have separate stacks.',h:'Think about resource sharing.',f:['What is a context switch?']},
{id:'os2',d:'OS',s:'Scheduling',df:2,q:'Explain CPU scheduling algorithms.',k:['FCFS','SJF','round robin','priority','preemptive','non-preemptive','quantum'],a:'FCFS: first come first served. SJF: shortest job first. Round Robin: time quantum based. Priority: based on priority value. Preemptive algorithms can interrupt running process; non-preemptive cannot.',h:'Think about how OS decides which process runs next.',f:['What is starvation and how to prevent it?']},
{id:'os3',d:'OS',s:'Memory',df:2,q:'Explain virtual memory and paging.',k:['virtual memory','page','frame','page table','page fault','swap','demand paging'],a:'Virtual memory allows executing processes larger than physical memory. Paging divides memory into fixed-size pages (logical) and frames (physical). Page table maps pages to frames. Page fault occurs when needed page is not in memory.',h:'Think about illusion of unlimited memory.',f:['What is thrashing?']},
{id:'os4',d:'OS',s:'Deadlock',df:2,q:'What is deadlock? Explain its conditions and prevention.',k:['mutual exclusion','hold and wait','no preemption','circular wait','prevention','avoidance','detection'],a:'Deadlock occurs when processes wait for each other indefinitely. Four conditions: Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait. Prevention: break any one condition. Avoidance: Bankers algorithm.',h:'All four conditions must hold simultaneously.',f:['Explain Bankers algorithm.']},
{id:'os5',d:'OS',s:'Synchronization',df:2,q:'What are semaphores? Explain with example.',k:['semaphore','mutex','wait','signal','critical section','synchronization','binary','counting'],a:'Semaphore is a synchronization tool. Binary semaphore (0/1) acts like mutex. Counting semaphore manages resource pool. Operations: wait (P) decrements, signal (V) increments. Prevents race conditions in critical sections.',h:'Think about controlling access to shared resources.',f:['Difference between semaphore and mutex?']},
// CN
{id:'cn1',d:'CN',s:'OSI Model',df:1,q:'Explain the OSI model layers.',k:['physical','data link','network','transport','session','presentation','application','7 layers'],a:'OSI has 7 layers: Physical (bits), Data Link (frames), Network (packets/routing), Transport (segments/TCP/UDP), Session (connections), Presentation (encryption/format), Application (user interface/HTTP).',h:'Please Do Not Throw Sausage Pizza Away.',f:['Difference between OSI and TCP/IP model?']},
{id:'cn2',d:'CN',s:'TCP/IP',df:1,q:'Explain TCP vs UDP.',k:['connection-oriented','connectionless','reliable','unreliable','handshake','acknowledgment','flow control'],a:'TCP: connection-oriented, reliable, ordered delivery, flow control, 3-way handshake. Used for HTTP, email. UDP: connectionless, unreliable, faster, no overhead. Used for streaming, gaming, DNS.',h:'TCP is like registered mail; UDP is like postcards.',f:['Explain the 3-way handshake.']},
{id:'cn3',d:'CN',s:'HTTP',df:1,q:'What is HTTP? Explain HTTP methods.',k:['GET','POST','PUT','DELETE','stateless','request','response','REST'],a:'HTTP is stateless application-layer protocol for web. Methods: GET (retrieve), POST (create), PUT (update), DELETE (remove), PATCH (partial update). Status codes: 2xx success, 4xx client error, 5xx server error.',h:'Think about CRUD operations.',f:['What is the difference between PUT and PATCH?']},
{id:'cn4',d:'CN',s:'DNS',df:2,q:'Explain how DNS works.',k:['domain name system','resolver','root server','TLD','authoritative','IP address','cache'],a:'DNS translates domain names to IP addresses. Process: Browser cache → OS cache → Recursive resolver → Root server → TLD server → Authoritative server → Returns IP. Uses UDP port 53.',h:'Think of DNS as the phonebook of the internet.',f:['What is DNS poisoning?']},
// OOP
{id:'oop1',d:'OOP',s:'Pillars',df:1,q:'Explain the four pillars of OOP.',k:['encapsulation','abstraction','inheritance','polymorphism','object','class'],a:'Encapsulation: bundling data and methods, controlling access. Abstraction: hiding complexity, showing essentials. Inheritance: creating new classes from existing ones (code reuse). Polymorphism: same interface, different behaviors (overloading/overriding).',h:'Think: EAIP.',f:['Give real-world examples of each pillar.']},
{id:'oop2',d:'OOP',s:'Inheritance',df:1,q:'What are different types of inheritance?',k:['single','multiple','multilevel','hierarchical','hybrid','extends','interface'],a:'Single: one parent one child. Multilevel: chain of inheritance. Hierarchical: one parent multiple children. Multiple: multiple parents (not in Java, use interfaces). Hybrid: combination of types.',h:'Draw family tree diagrams.',f:['Why doesnt Java support multiple inheritance?']},
{id:'oop3',d:'OOP',s:'Polymorphism',df:2,q:'Explain method overloading vs overriding.',k:['overloading','overriding','compile time','runtime','static','dynamic','same name'],a:'Overloading: same method name, different parameters in same class (compile-time/static polymorphism). Overriding: same method signature in parent-child classes (runtime/dynamic polymorphism). Overriding uses virtual table.',h:'Overloading = same class; Overriding = parent-child.',f:['Can we override static methods?']},
{id:'oop4',d:'OOP',s:'Design Patterns',df:3,q:'Explain Singleton design pattern.',k:['singleton','single instance','private constructor','static','global access','thread safe'],a:'Singleton ensures only one instance of a class exists with global access point. Implementation: private constructor, static instance variable, public static getInstance() method. Used for logging, config, connection pools.',h:'Only one instance throughout application.',f:['How to make Singleton thread-safe?']},
// Web Dev
{id:'web1',d:'Web Dev',s:'HTML/CSS',df:1,q:'What is the difference between div and span?',k:['block','inline','div','span','container','layout'],a:'div is a block-level element taking full width, used for layout sections. span is inline element taking only needed width, used for styling text portions. Both are generic containers with no semantic meaning.',h:'Block vs inline elements.',f:['Name other block and inline elements.']},
{id:'web2',d:'Web Dev',s:'JavaScript',df:1,q:'Explain var, let, and const in JavaScript.',k:['var','let','const','scope','hoisting','block scope','function scope','reassign'],a:'var: function-scoped, hoisted, can redeclare. let: block-scoped, hoisted but TDZ, cannot redeclare but can reassign. const: block-scoped, hoisted but TDZ, cannot redeclare or reassign. Prefer const, then let.',h:'Think about scope and reassignment.',f:['What is the Temporal Dead Zone?']},
{id:'web3',d:'Web Dev',s:'JavaScript',df:2,q:'Explain closures in JavaScript.',k:['closure','inner function','outer scope','lexical scope','private','encapsulation'],a:'A closure is a function that retains access to its outer (enclosing) function scope even after the outer function has returned. Used for data privacy, module pattern, callbacks. Inner function "closes over" outer variables.',h:'Function remembers where it was born.',f:['Give practical uses of closures.']},
{id:'web4',d:'Web Dev',s:'JavaScript',df:2,q:'What is the event loop in JavaScript?',k:['event loop','call stack','callback queue','microtask','macrotask','single threaded','async'],a:'JavaScript is single-threaded. Event loop manages async operations. Call stack executes sync code. Async callbacks go to callback queue. Event loop moves callbacks to stack when empty. Microtasks (promises) have priority over macrotasks (setTimeout).',h:'Stack, Queue, and Loop.',f:['Explain the difference between microtasks and macrotasks.']},
{id:'web5',d:'Web Dev',s:'React',df:2,q:'What is Virtual DOM? How does React use it?',k:['virtual DOM','reconciliation','diffing','real DOM','performance','rendering','state change'],a:'Virtual DOM is lightweight JS copy of real DOM. When state changes, React creates new virtual DOM, diffs with previous (reconciliation), and updates only changed parts in real DOM. This makes updates faster than direct DOM manipulation.',h:'Think of it as a draft before final edit.',f:['What is React Fiber?']},
// Python
{id:'py1',d:'Python',s:'Core',df:1,q:'What are Python data types? Explain mutable vs immutable.',k:['int','float','string','list','tuple','dict','set','mutable','immutable'],a:'Immutable: int, float, string, tuple, frozenset (cannot change after creation). Mutable: list, dict, set (can be modified). Immutability helps with hashing and thread safety.',h:'Can you change the object after creation?',f:['Why are strings immutable in Python?']},
{id:'py2',d:'Python',s:'Core',df:1,q:'What is the difference between list and tuple?',k:['list','tuple','mutable','immutable','square brackets','parentheses','performance'],a:'List is mutable (can add/remove/modify elements), uses []. Tuple is immutable (fixed after creation), uses (). Tuples are faster, hashable (can be dict keys), and memory efficient. Use tuple for fixed data.',h:'Lists change, tuples dont.',f:['When would you choose tuple over list?']},
{id:'py3',d:'Python',s:'OOP',df:2,q:'Explain decorators in Python.',k:['decorator','wrapper','function','@','higher order','modify behavior','closure'],a:'Decorators modify function behavior without changing source code. They are higher-order functions wrapping other functions. Uses @decorator syntax. Common decorators: @staticmethod, @classmethod, @property. Built on closures.',h:'Function that wraps another function.',f:['Write a custom decorator.']},
{id:'py4',d:'Python',s:'Core',df:2,q:'Explain list comprehension vs generator expression.',k:['list comprehension','generator','lazy evaluation','memory','yield','iteration'],a:'List comprehension [x for x in range(n)] creates full list in memory. Generator expression (x for x in range(n)) generates values lazily one at a time. Generators are memory efficient for large datasets.',h:'Eager vs lazy evaluation.',f:['When to use generators?']},
// Java
{id:'java1',d:'Java',s:'Core',df:1,q:'Explain JDK, JRE, and JVM.',k:['JDK','JRE','JVM','compiler','bytecode','platform independent','runtime'],a:'JVM: executes bytecode, provides platform independence. JRE: JVM + class libraries needed to run programs. JDK: JRE + development tools (compiler, debugger). JDK ⊃ JRE ⊃ JVM.',h:'Think of nesting: JDK contains JRE contains JVM.',f:['How does JVM achieve platform independence?']},
{id:'java2',d:'Java',s:'Core',df:1,q:'What is the difference between == and equals() in Java?',k:['reference','value','equals','object comparison','string pool','hashcode'],a:'== compares references (memory addresses). equals() compares content/values (can be overridden). For primitives, == compares values. For objects, == checks if same object; equals() checks logical equality.',h:'== checks identity; equals() checks equality.',f:['Why should you override hashCode when overriding equals?']},
{id:'java3',d:'Java',s:'Collections',df:2,q:'Explain HashMap vs TreeMap vs LinkedHashMap.',k:['HashMap','TreeMap','LinkedHashMap','ordering','hashing','red-black tree','insertion order'],a:'HashMap: O(1) operations, no ordering, allows one null key. TreeMap: O(log n), sorted by keys, uses red-black tree. LinkedHashMap: O(1), maintains insertion order, uses doubly-linked list.',h:'Ordering is the key difference.',f:['How does HashMap handle collisions?']},
{id:'java4',d:'Java',s:'Multithreading',df:2,q:'What is synchronization in Java? Explain synchronized keyword.',k:['synchronized','thread safe','lock','monitor','mutex','critical section','concurrent'],a:'Synchronization prevents multiple threads from accessing shared resources simultaneously. synchronized keyword acquires object lock. Can be applied to methods or blocks. Only one thread enters synchronized block at a time, preventing race conditions.',h:'Think about thread safety.',f:['What is the difference between synchronized and volatile?']},
// SQL
{id:'sql1',d:'SQL',s:'Queries',df:1,q:'Explain WHERE vs HAVING clause.',k:['WHERE','HAVING','filter','aggregate','GROUP BY','before','after'],a:'WHERE filters individual rows before grouping. HAVING filters groups after GROUP BY and aggregation. WHERE cannot use aggregate functions; HAVING can. Example: WHERE salary > 5000 vs HAVING COUNT(*) > 3.',h:'WHERE = row filter, HAVING = group filter.',f:['Can HAVING be used without GROUP BY?']},
{id:'sql2',d:'SQL',s:'Queries',df:2,q:'Explain subqueries and their types.',k:['subquery','nested','correlated','scalar','inline view','exists','in'],a:'Subquery is query inside another query. Types: Scalar (returns single value), Row (single row), Table (multiple rows/columns). Correlated subquery references outer query and executes per row. Non-correlated executes once.',h:'Query within a query.',f:['Performance difference between JOIN and subquery?']},
{id:'sql3',d:'SQL',s:'Queries',df:1,q:'What is the difference between DELETE, TRUNCATE, and DROP?',k:['DELETE','TRUNCATE','DROP','rollback','DML','DDL','WHERE','log'],a:'DELETE: DML, removes rows with WHERE, can rollback, fires triggers, logged. TRUNCATE: DDL, removes all rows, faster, cannot rollback (usually), resets identity. DROP: DDL, removes entire table structure.',h:'Think about what gets removed and recoverability.',f:['Can TRUNCATE be rolled back?']},
// HR
{id:'hr1',d:'HR',s:'Personal',df:1,q:'Tell me about yourself.',k:['education','experience','skills','passion','career','goal','project'],a:'Structure: Present (current role/education), Past (relevant experience/projects), Future (career goals aligned with role). Keep it 2-3 minutes, professional, and relevant to the position.',h:'Present → Past → Future formula.',f:['What makes you unique?']},
{id:'hr2',d:'HR',s:'Personal',df:1,q:'What are your strengths and weaknesses?',k:['strength','weakness','improve','self-aware','example','overcome','growth'],a:'Strengths: Pick 2-3 relevant to role with examples. Weaknesses: Be honest but show improvement efforts. Avoid cliches. Example weakness: "I sometimes over-analyze, but Ive started setting decision deadlines."',h:'Be honest with strengths, show growth for weaknesses.',f:['Give me an example of when your strength helped you.']},
{id:'hr3',d:'HR',s:'Career',df:1,q:'Why should we hire you?',k:['skills','value','contribution','match','qualified','unique','team'],a:'Connect your skills to job requirements. Highlight unique value proposition. Show enthusiasm for the role. Mention specific contributions you can make. Be confident but not arrogant.',h:'Match your skills to their needs.',f:['What value can you add to our team?']},
{id:'hr4',d:'HR',s:'Career',df:1,q:'Where do you see yourself in 5 years?',k:['growth','career','goals','learn','leadership','contribute','development'],a:'Show ambition aligned with company growth. Express desire to learn and take on responsibility. Be realistic. Example: "I see myself as a senior developer leading projects and mentoring juniors, having deepened my expertise."',h:'Show ambition aligned with company.',f:['How does this role fit your long-term goals?']},
{id:'hr5',d:'HR',s:'Behavioral',df:1,q:'Tell me about a time you faced a challenge and how you overcame it.',k:['challenge','situation','task','action','result','STAR','problem solving','overcome'],a:'Use STAR method: Situation (set the scene), Task (your responsibility), Action (what you did specifically), Result (outcome with metrics if possible). Show problem-solving skills and resilience.',h:'Use the STAR method.',f:['What did you learn from that experience?']},
{id:'hr6',d:'HR',s:'Teamwork',df:1,q:'How do you handle conflict in a team?',k:['communication','listen','compromise','resolve','understand','perspective','professional'],a:'Listen to all perspectives. Focus on the issue not the person. Seek compromise and common ground. Communicate openly and professionally. Escalate if needed. Give a specific example using STAR method.',h:'Focus on resolution, not blame.',f:['Give a specific example of conflict resolution.']},
{id:'hr7',d:'HR',s:'Personal',df:1,q:'Why do you want to work at this company?',k:['research','culture','mission','growth','technology','values','opportunity'],a:'Show you researched the company. Mention specific aspects: culture, mission, technology, growth opportunities. Connect company values to your own. Be genuine and specific, not generic.',h:'Show you know the company.',f:['What do you know about our products?']},
{id:'hr8',d:'HR',s:'Career',df:1,q:'What is your expected salary?',k:['research','market','range','negotiable','value','experience','flexible'],a:'Research market rates for role and location. Give a range based on research. Focus on value you bring. Say you are open to discussion based on total compensation package including benefits.',h:'Research before answering.',f:['Is salary the most important factor for you?']},
// Behavioral
{id:'bh1',d:'Behavioral',s:'Leadership',df:2,q:'Describe a time when you took initiative on a project.',k:['initiative','proactive','leadership','impact','identified','improvement','result'],a:'Use STAR. Show you identified an opportunity without being asked, took ownership, planned and executed, and achieved measurable results. Demonstrates proactivity and leadership potential.',h:'STAR method - emphasize YOUR initiative.',f:['What was the impact of your initiative?']},
{id:'bh2',d:'Behavioral',s:'Teamwork',df:1,q:'Tell me about a successful team project you contributed to.',k:['team','collaboration','role','contribution','communication','success','together'],a:'Describe the project, your specific role, how you collaborated. Highlight communication, division of work, how you handled disagreements. Focus on collective success while showing your individual contribution.',h:'Balance team and individual contribution.',f:['What made the team work well together?']},
{id:'bh3',d:'Behavioral',s:'Problem Solving',df:2,q:'Describe a time you had to learn something quickly.',k:['learning','adapt','quick','deadline','resource','self-study','apply'],a:'Use STAR. Show the urgency, resources you used (docs, tutorials, mentors), how you applied knowledge quickly, and the successful outcome. Demonstrates adaptability and learning agility.',h:'Show your learning process.',f:['How do you approach learning new technologies?']},
// System Design
{id:'sd1',d:'System Design',s:'Basics',df:3,q:'How would you design a URL shortener like bit.ly?',k:['hash','database','redirect','base62','collision','cache','scalability','analytics'],a:'Components: Hash generation (base62 encoding), Database (map short URL to long), Redirect service (301/302), Cache (Redis for hot URLs), Analytics. Handle collisions, custom aliases. Scale with load balancer, database sharding.',h:'Think about generating unique short codes.',f:['How would you handle billions of URLs?']},
{id:'sd2',d:'System Design',s:'Basics',df:3,q:'Explain load balancing and its algorithms.',k:['load balancer','round robin','least connections','health check','horizontal scaling','distribution'],a:'Load balancer distributes traffic across servers. Algorithms: Round Robin, Weighted Round Robin, Least Connections, IP Hash, Least Response Time. Types: L4 (transport) and L7 (application). Health checks monitor server status.',h:'Think about distributing restaurant orders among chefs.',f:['What is the difference between L4 and L7 load balancing?']},
{id:'sd3',d:'System Design',s:'Caching',df:2,q:'What is caching? Explain caching strategies.',k:['cache','Redis','CDN','cache aside','write through','write behind','eviction','TTL','LRU'],a:'Caching stores frequently accessed data in fast storage. Strategies: Cache-Aside (app manages), Write-Through (write to cache+DB), Write-Behind (write cache, async DB). Eviction: LRU, LFU, TTL. Use CDN for static assets.',h:'Think about frequently accessed data.',f:['How to handle cache invalidation?']}
];
function getByDomain(domain){return Q.filter(q=>q.d===domain);}
function getByDifficulty(df){return Q.filter(q=>q.df===df);}
function getFiltered(opts={}){
let result=[...Q];
if(opts.domain)result=result.filter(q=>q.d===opts.domain);
if(opts.difficulty)result=result.filter(q=>q.df===opts.difficulty);
if(opts.exclude)result=result.filter(q=>!opts.exclude.includes(q.id));
return result;
}
function selectQuestions(opts={}){
let available = [...Q];
if (opts.domain && opts.domain.startsWith('Company - ')) {
  const company = opts.domain.replace('Company - ', '');
  let companyQuestions = [];
  if (company === 'Google') {
    companyQuestions = available.filter(q => q.d === 'DSA' && q.df === 3).slice(0, 3);
    companyQuestions = companyQuestions.concat(available.filter(q => q.d === 'System Design').slice(0, 2));
    companyQuestions = companyQuestions.concat(available.filter(q => q.d === 'Behavioral').slice(0, 1));
  } else if (company === 'Amazon') {
    companyQuestions = available.filter(q => q.d === 'Behavioral').slice(0, 3);
    companyQuestions = companyQuestions.concat(available.filter(q => q.d === 'DSA' && q.df !== 1).slice(0, 2));
    companyQuestions = companyQuestions.concat(available.filter(q => q.d === 'System Design').slice(0, 1));
  } else if (company === 'Microsoft') {
    companyQuestions = available.filter(q => q.d === 'DSA' && q.df === 2).slice(0, 2);
    companyQuestions = companyQuestions.concat(available.filter(q => ['OS', 'DBMS', 'CN'].includes(q.d)).slice(0, 3));
    companyQuestions = companyQuestions.concat(available.filter(q => q.d === 'System Design').slice(0, 1));
  } else if (company === 'TCS') {
    companyQuestions = available.filter(q => ['Java', 'Python', 'OOP', 'SQL'].includes(q.d)).slice(0, 4);
    companyQuestions = companyQuestions.concat(available.filter(q => q.d === 'HR').slice(0, 2));
  }
  if(companyQuestions.length > 0) return companyQuestions;
}
const pool=getFiltered(opts);
const count=opts.count||10;
const shuffled=pool.sort(()=>Math.random()-0.5);
return shuffled.slice(0,Math.min(count,shuffled.length));
}
function getById(id){return Q.find(q=>q.id===id)||null;}
function getDomains(){return[...new Set(Q.map(q=>q.d))];}
function getCount(){return Q.length;}
function getAll(){return[...Q];}

const aptitudeQuestions = {
  'Quantitative Aptitude': [
    {
      text: 'A sum of money doubles itself at simple interest in 8 years. In how many years will it triple itself?',
      options: ['12 years', '16 years', '20 years', '24 years'],
      correctOption: 'B',
      subtopic: 'Simple Interest'
    },
    {
      text: 'Two trains running in opposite directions cross a man standing on the platform in 27 seconds and 17 seconds respectively and they cross each other in 23 seconds. The ratio of their speeds is:',
      options: ['1:3', '3:2', '3:4', 'None of these'],
      correctOption: 'B',
      subtopic: 'Speed & Distance'
    },
    {
      text: 'A, B and C can do a piece of work in 20, 30 and 60 days respectively. In how many days can A do the work if he is assisted by B and C on every third day?',
      options: ['12 days', '15 days', '16 days', '18 days'],
      correctOption: 'B',
      subtopic: 'Time & Work'
    },
    {
      text: 'The average of 20 numbers is zero. Of them, at the most, how many may be greater than zero?',
      options: ['0', '1', '10', '19'],
      correctOption: 'D',
      subtopic: 'Averages'
    },
    {
      text: 'A container contains 40 litres of milk. From this container 4 litres of milk was taken out and replaced by water. This process was repeated further two times. How much milk is now contained by the container?',
      options: ['26.34 litres', '27.36 litres', '28 litres', '29.16 litres'],
      correctOption: 'D',
      subtopic: 'Alligations & Mixtures'
    }
  ],
  'Logical Reasoning': [
    {
      text: 'Look at this series: 2, 1, (1/2), (1/4), ... What number should come next?',
      options: ['(1/3)', '1/8', '2/8', '1/16'],
      correctOption: 'B',
      subtopic: 'Number Series'
    },
    {
      text: 'SCD, TEF, UGH, ____, WKL. Find the missing letters.',
      options: ['VIJ', 'VJK', 'IJT', 'IJK'],
      correctOption: 'A',
      subtopic: 'Letter Series'
    },
    {
      text: 'Pointing to a photograph of a boy Suresh said, "He is the son of the only son of my mother." How is Suresh related to that boy?',
      options: ['Brother', 'Uncle', 'Cousin', 'Father'],
      correctOption: 'D',
      subtopic: 'Blood Relations'
    },
    {
      text: 'If in a certain language, MADRAS is coded as NBESBT, how is BOMBAY coded in that code?',
      options: ['CPNCBX', 'CPNCBY', 'CPNCPZ', 'CPNCBZ'],
      correctOption: 'B',
      subtopic: 'Coding-Decoding'
    },
    {
      text: 'A man walks 5 km toward south and then turns to the right. After walking 3 km he turns to the left and walks 5 km. Now in which direction is he from the starting place?',
      options: ['West', 'South', 'North-East', 'South-West'],
      correctOption: 'D',
      subtopic: 'Direction Sense'
    }
  ],
  'Verbal Ability': [
    {
      text: 'Find the synonym of: CANDID',
      options: ['Honest', 'Secretive', 'Vague', 'Insincere'],
      correctOption: 'A',
      subtopic: 'Synonyms'
    },
    {
      text: 'Choose the word which is opposite in meaning (antonym) of: ENORMOUS',
      options: ['Tiny', 'Soft', 'Average', 'Weak'],
      correctOption: 'A',
      subtopic: 'Antonyms'
    },
    {
      text: 'Identify the grammatically correct sentence:',
      options: [
        'Everyone should mind their own business.',
        'Everyone should mind his or her own business.',
        'Everyone should mind there own business.',
        'Everyone should mind one\'s own business.'
      ],
      correctOption: 'B',
      subtopic: 'Grammar'
    },
    {
      text: 'Select the correctly spelled word:',
      options: ['Receive', 'Recieve', 'Receve', 'Reiceve'],
      correctOption: 'A',
      subtopic: 'Spelling'
    },
    {
      text: 'Complete the sentence: The reward was not commensurate _______ the work done by us.',
      options: ['for', 'on', 'with', 'order'],
      correctOption: 'C',
      subtopic: 'Prepositions'
    }
  ],
  'CS Fundamentals': [
    {
      text: 'Which data structure is typically used to implement recursion?',
      options: ['Queue', 'Stack', 'Tree', 'Graph'],
      correctOption: 'B',
      subtopic: 'Data Structures'
    },
    {
      text: 'What is the worst-case time complexity of Quick Sort?',
      options: ['O(n log n)', 'O(n)', 'O(n²)', 'O(log n)'],
      correctOption: 'C',
      subtopic: 'Algorithms'
    },
    {
      text: 'In the context of databases, what does the "I" in ACID stand for?',
      options: ['Integrity', 'Isolation', 'Index', 'Inheritance'],
      correctOption: 'B',
      subtopic: 'DBMS'
    },
    {
      text: 'Which layer of the OSI model is responsible for routing packets across networks?',
      options: ['Transport Layer', 'Network Layer', 'Data Link Layer', 'Physical Layer'],
      correctOption: 'B',
      subtopic: 'Computer Networks'
    },
    {
      text: 'Which of the following is not a pillar of Object-Oriented Programming?',
      options: ['Compilation', 'Encapsulation', 'Polymorphism', 'Abstraction'],
      correctOption: 'A',
      subtopic: 'OOP'
    }
  ],
  'Data Interpretation': [
    {
      text: 'If the total sales of a company in 2025 were $500,000 and it increased by 20% in 2026, what were the sales in 2026?',
      options: ['$550,000', '$600,000', '$620,000', '$650,000'],
      correctOption: 'B',
      subtopic: 'Percentage Growth'
    },
    {
      text: 'In a pie chart representing student grades, Grade A is represented by a sector with a central angle of 72 degrees. What percentage of students got Grade A?',
      options: ['15%', '20%', '25%', '30%'],
      correctOption: 'B',
      subtopic: 'Pie Charts'
    },
    {
      text: 'A company spends 30% of its budget on salaries, 25% on marketing, 20% on R&D, and the remaining $50,000 on administration. What is the total budget?',
      options: ['$150,000', '$200,000', '$250,000', '$300,000'],
      correctOption: 'B',
      subtopic: 'Budget Allocation'
    },
    {
      text: 'The ratio of production of Item A to Item B is 3:5. If the production of Item B is 1500 units, what is the production of Item A?',
      options: ['600 units', '900 units', '1000 units', '1200 units'],
      correctOption: 'B',
      subtopic: 'Ratios'
    },
    {
      text: 'The average sales of three branches of a store are $12,000. If two branches have sales of $10,000 and $15,000, what are the sales of the third branch?',
      options: ['$11,000', '$12,000', '$13,000', '$14,000'],
      correctOption: 'A',
      subtopic: 'Averages'
    }
  ],
  'General Knowledge': [
    {
      text: 'Who is known as the father of Artificial Intelligence?',
      options: ['Alan Turing', 'John McCarthy', 'Charles Babbage', 'Ada Lovelace'],
      correctOption: 'B',
      subtopic: 'History of IT'
    },
    {
      text: 'Which country is the largest exporter of goods globally?',
      options: ['USA', 'China', 'Germany', 'Japan'],
      correctOption: 'B',
      subtopic: 'Global Economics'
    },
    {
      text: 'What is the primary greenhouse gas responsible for global warming?',
      options: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Argon'],
      correctOption: 'B',
      subtopic: 'Environmental Science'
    },
    {
      text: 'Which organ in the human body is responsible for pumping blood?',
      options: ['Lungs', 'Brain', 'Liver', 'Heart'],
      correctOption: 'D',
      subtopic: 'Human Anatomy'
    },
    {
      text: 'Which is the largest ocean on Earth?',
      options: ['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Pacific Ocean'],
      correctOption: 'D',
      subtopic: 'Geography'
    }
  ]
};

function getAptitudeQuestions(selectedTopics = [], count = 15) {
  let pool = [];
  if (!Array.isArray(selectedTopics) || selectedTopics.length === 0) {
    selectedTopics = Object.keys(aptitudeQuestions);
  }
  
  selectedTopics.forEach(topic => {
    if (aptitudeQuestions[topic]) {
      pool = pool.concat(aptitudeQuestions[topic]);
    }
  });

  if (pool.length === 0) {
    Object.values(aptitudeQuestions).forEach(qs => {
      pool = pool.concat(qs);
    });
  }

  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

const mockCodingQuestions = [
  {
    topic: 'Arrays, Matrices & Strings',
    title: 'Two Sum',
    difficulty: 'Easy',
    description: '<p>Given an array of integers <code>nums</code> and an integer <code>target</code>, return indices of the two numbers such that they add up to <code>target</code>.</p>',
    statement: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    constraints: '2 <= nums.length <= 10^5\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nExactly one valid answer exists.',
    inputFormat: 'Line 1: space-separated integers\nLine 2: target integer',
    outputFormat: 'Two space-separated indices in ascending order.',
    sampleInput: '2 7 11 15\n9',
    sampleOutput: '0 1',
    explanation: 'nums[0] + nums[1] = 2 + 7 = 9',
    visibleTests: '2 7 11 15\n9|0 1\n3 2 4\n6|1 2',
    hiddenTests: '3 3\n6|0 1\n2 7 11 15\n9|0 1',
    starterCode: {
      javascript: 'function twoSum(nums, target) {\n    // Write your code here\n}',
      python: 'def twoSum(nums, target):\n    # Write your code here\n    pass',
      java: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your code here\n    }\n}',
      cpp: 'class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your code here\n    }\n};',
      c: 'int* twoSum(int* nums, int numsSize, int target, int* returnSize) {\n    // Write your code here\n}'
    }
  },
  {
    topic: 'Arrays, Matrices & Strings',
    title: 'Reverse String',
    difficulty: 'Easy',
    description: '<p>Write a function that reverses a string. The input string is given as an array of characters <code>s</code>.</p>',
    statement: 'Write a function that reverses a string. The input string is given as an array of characters s.',
    constraints: '1 <= s.length <= 10^5\ns[i] is a printable ascii character.',
    inputFormat: 'Line 1: A string s',
    outputFormat: 'The reversed string',
    sampleInput: 'hello',
    sampleOutput: 'olleh',
    explanation: 'The string "hello" reversed is "olleh".',
    visibleTests: 'hello|olleh\nworld|dlrow',
    hiddenTests: 'a|a\nab|ba\nleetcode|edocteel',
    starterCode: {
      javascript: 'function reverseString(s) {\n    // Write your code here\n}',
      python: 'def reverseString(s):\n    # Write your code here\n    pass',
      java: 'class Solution {\n    public void reverseString(char[] s) {\n        // Write your code here\n    }\n}',
      cpp: 'class Solution {\npublic:\n    void reverseString(vector<char>& s) {\n        // Write your code here\n    }\n};',
      c: 'void reverseString(char* s, int sSize) {\n    // Write your code here\n}'
    }
  },
  {
    topic: 'Dynamic Programming & DSA',
    title: 'Climbing Stairs',
    difficulty: 'Moderate',
    description: '<p>You are climbing a staircase. It takes <code>n</code> steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?</p>',
    statement: 'You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?',
    constraints: '1 <= n <= 45',
    inputFormat: 'Line 1: An integer n',
    outputFormat: 'An integer representing distinct ways.',
    sampleInput: '3',
    sampleOutput: '3',
    explanation: '1. 1 step + 1 step + 1 step\n2. 1 step + 2 steps\n3. 2 steps + 1 step',
    visibleTests: '2|2\n3|3',
    hiddenTests: '4|5\n5|8\n10|89',
    starterCode: {
      javascript: 'function climbStairs(n) {\n    // Write your code here\n}',
      python: 'def climbStairs(n):\n    # Write your code here\n    pass',
      java: 'class Solution {\n    public int climbStairs(int n) {\n        // Write your code here\n    }\n}',
      cpp: 'class Solution {\npublic:\n    int climbStairs(int n) {\n        // Write your code here\n    }\n};',
      c: 'int climbStairs(int n) {\n    // Write your code here\n}'
    }
  },
  {
    topic: 'Dynamic Programming & DSA',
    title: 'Longest Increasing Subsequence',
    difficulty: 'Hard',
    description: '<p>Given an integer array <code>nums</code>, return the length of the longest strictly increasing subsequence.</p>',
    statement: 'Given an integer array nums, return the length of the longest strictly increasing subsequence.',
    constraints: '1 <= nums.length <= 2500\n-10^4 <= nums[i] <= 10^4',
    inputFormat: 'Line 1: Space separated integers',
    outputFormat: 'Integer representing the length.',
    sampleInput: '10 9 2 5 3 7 101 18',
    sampleOutput: '4',
    explanation: 'The longest increasing subsequence is [2,3,7,101], length is 4.',
    visibleTests: '10 9 2 5 3 7 101 18|4\n0 1 0 3 2 3|4',
    hiddenTests: '7 7 7 7 7 7 7|1\n1 2 3 4 5|5\n5 4 3 2 1|1',
    starterCode: {
      javascript: 'function lengthOfLIS(nums) {\n    // Write your code here\n}',
      python: 'def lengthOfLIS(nums):\n    # Write your code here\n    pass',
      java: 'class Solution {\n    public int lengthOfLIS(int[] nums) {\n        // Write your code here\n    }\n}',
      cpp: 'class Solution {\npublic:\n    int lengthOfLIS(vector<int>& nums) {\n        // Write your code here\n    }\n};',
      c: 'int lengthOfLIS(int* nums, int numsSize) {\n    // Write your code here\n}'
    }
  },
  {
    topic: 'SQL & Databases',
    title: 'Second Highest Salary',
    difficulty: 'Moderate',
    description: '<p>Write a SQL query to report the second highest salary from the Employee table. If there is no second highest salary, the query should report null.</p>',
    statement: 'Write a SQL query to report the second highest salary from the Employee table.',
    constraints: 'SQL Evaluation Environment',
    inputFormat: 'Employee table with id and salary',
    outputFormat: 'SecondHighestSalary',
    sampleInput: 'Employee table:\n| id | salary |\n| 1  | 100    |\n| 2  | 200    |\n| 3  | 300    |',
    sampleOutput: '| SecondHighestSalary |\n| 200                 |',
    explanation: '300 is the highest, 200 is the second highest.',
    visibleTests: 'SELECT * FROM Employee|Run against test DB',
    hiddenTests: 'Hidden test cases',
    starterCode: {
      javascript: '/* SQL logic here */',
      python: '# SQL logic here',
      java: '// SQL logic here',
      cpp: '// SQL logic here',
      c: '// SQL logic here'
    }
  }
];

function generateAITopicQuestions(configs) {
  let finalQuestions = [];
  
  configs.forEach(cfg => {
    // Filter questions that match topic and difficulty
    let candidates = mockCodingQuestions.filter(q => 
      q.topic === cfg.topic && q.difficulty === cfg.difficulty
    );
    
    // If not enough perfect matches, relax difficulty, then relax topic
    if (candidates.length < cfg.count) {
      candidates = candidates.concat(mockCodingQuestions.filter(q => q.topic === cfg.topic && q.difficulty !== cfg.difficulty));
    }
    if (candidates.length < cfg.count) {
      candidates = candidates.concat(mockCodingQuestions.filter(q => q.topic !== cfg.topic));
    }
    
    // Unique questions
    candidates = [...new Set(candidates)];
    
    // Shuffle and pick exactly 'count'
    const shuffled = candidates.sort(() => Math.random() - 0.5);
    finalQuestions = finalQuestions.concat(shuffled.slice(0, cfg.count));
  });
  
  return finalQuestions;
}

return {
  getByDomain,
  getByDifficulty,
  getFiltered,
  selectQuestions,
  getById,
  getDomains,
  getCount,
  getAll,
  getAptitudeQuestions,
  generateAITopicQuestions
};
})();
