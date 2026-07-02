// Names database organized by nationality
const NAMES_DATABASE = {
    "Switzerland": {
    "firstNames": [
        "Lukas", "Noah", "Leon", "Luca", "David", "Nico", "Simon", "Fabian", "Marco", "Jonas", 
        "Sandro", "Kevin", "Robin", "Manuel", "Adrian", "Loris", "Joel", "Fabio", "Tim", "Jan",
        "Samuel", "Matthias", "Cédric", "Yannick", "Julian", "Andreas", "Florian", "Dominik", "Patrick", "Marc",
        "Reto", "Beat", "Urs", "Christian", "Thomas", "Daniel", "Stefan", "Martin", "Pius", "Andrin",
        "Levin", "Elias", "Liam", "Leandro", "Matteo", "Nino", "Alessio", "Leandro", "Elia", "Nevio",
        "Dragan", "Besnik", "Adnan", "Emir", "Amir", "Luan", "Valon", "Arben", "Mergim", "Bekim",
        "Jean", "Pierre", "Luc", "Mathieu", "Guillaume", "Bastien", "Loïc", "Arnaud", "Florent", "Quentin",
        "Alessandro", "Leonardo", "Diego", "Giuseppe", "Francesco", "Pietro", "Antonio", "Lorenzo", "Rocco", "Flavio",
        "Gion", "Flurin", "Corsin", "Gian", "Curdin", "Duri", "Andri", "Peider", "Linard", "Madlaina",
        "Tiago", "João", "Ricardo", "Carlos", "Luis", "Miguel", "Enzo", "Rafael", "Gabriel", "Ismael", "Remo", "Jens",
	"Pascal", "Ludovic", "Guillaume", "George", "Damian", "Noah", "Noel", "Karl", "Karli", "Hans", "Peter", "Hanspeter", "Ueli",
	"Ferdinand", "Arno", "Michael", "Mike", "Mika", "Micha", "Martin", "Tinu", "Tino", "Valentin", "Alex", "Alexander", "Jan",
	"Sven", "Gian", "Kai", "Silas", "Paul", "Mario", "Timon", "Ben", "Benny", "Benjamin", "Adam",
	"Dario", "Albian", "Albin", "Ardon", "Kujtim", "Sindri", "Teijo", "Lindrit", "Sergio", "Fritz"
    ],
    "lastNames": [
        "Müller", "Meier", "Schmid", "Keller", "Weber", "Huber", "Schneider", "Meyer", "Steiner", "Fischer",
        "Gerber", "Brunner", "Baumann", "Moser", "Zimmermann", "Frei", "Widmer", "Graf", "Hofmann", "Roth",
        "Sutter", "Studer", "Wyss", "Lüthi", "Bachmann", "Pfister", "Bieri", "Marti", "Egger", "Glaus",
        "Hajrizi", "Petkovic", "Rakitic", "Shaqiri", "Xhaka", "Lustrinelli", "Yakin", "Dragovic", "Sulimani", "Krasniqi",
        "Favre", "Piccard", "Dutoit", "Girard", "Richard", "Lambert", "Grosjean", "Dubois", "Michaud", "Moret",
        "Bernasconi", "Bianchi", "Fontana", "Ferrari", "Zanetti", "Riva", "Crivelli", "Rossi", "Colombo", "Galli",
        "Candreia", "Capaul", "Caviezel", "Tuor", "Venzin", "Caduff", "Derungs", "Giger", "Tinner", "Sialm",
        "Da Silva", "Dos Santos", "Ferreira", "Pereira", "Rodrigues", "Almeida", "Lopes", "Oliveira", "Fernandez", "Garcia",
        "Sommer", "Kobel", "Akanji", "Embolo", "Zakaria", "Freuler", "Zuber", "Widmer", "Sow", "Steffen",
        "Vargas", "Okafor", "Aebischer", "Elvedi", "Schär", "Imeri", "Stergiou", "Lotomba", "Males", "Schlumpf",
	"Bucher", "Weirich", "Hanggartner", "Cologna", "Ammann", "Büchel", "Büchner", "Kägi", "Zweifel", "Freimann", "Frei",
	"Kamboundji", "Vergé-Depré", "Kälin", "Heidrich", "Mäder", "Bruderer", "Federer", "Brunner", "Geiger", "Gyger", "Gygax",
	"Gartenmann", "Schwertzmann", "Schweigler", "Schwegler", "Baumann", "Schär", "Scheidegger", "Sonderegger", "Schnyder",
	"Schneiter", "Dzemaili", "Neziraj", "Camus", "Comaran", "Sanches", "Koindredi", "Studer", "Farkas", "Schmuki", "Rohner",
	"Gavillet", "Martim", "Martin", "Ferrari", "Fontana", "Stäheli", "Stadel", "Schönbächler", "Stocker", "Zuberbühler",
	"Maissen", "Cavegn", "Wyss", "Schweizer", "Marthaler", "Berner", "Basler", "Burgener", "Degen", "Alpsteg", "Peter", 
	"Bieri", "Gasser", "Gashi", "Siegenthaler", "Vogt", "Küng", "Kuhn", "Odermatt", "Andermatt", "Chapuis", "Chautems", "Clement"
    ]
},
   "Brazil": {
    "firstNames": [
        "Gabriel", "Lucas", "Matheus", "Pedro", "Guilherme", "Enzo", "Arthur", "Gustavo", "Felipe", "João",
        "Rafael", "Leonardo", "Thiago", "Bruno", "Vinícius", "Rodrigo", "Marcelo", "Diego", "André", "Ricardo",
        "Fernando", "Luiz", "Eduardo", "Caio", "Murilo", "Cauã", "Vitor", "Daniel", "Samuel", "Igor",
        "Otávio", "Augusto", "Henrique", "Bernardo", "Bento", "Francisco", "Antônio", "José", "Paulo", "Carlos",
        "Marcos", "Alexandre", "Ronaldo", "Adriano", "Roberto", "Cláudio", "Sérgio", "Jorge", "Wilson", "Edson",
        "Anderson", "Jefferson", "Washington", "Wellington", "Everton", "Robson", "Douglas", "Maicon", "Cleiton", "Wesley",
        "Giovanni", "Lorenzo", "Lucca", "Pietro", "Matteo", "Fabrízio", "Enrico", "Dante", "Leandro", "Adriano",
        "Hans", "Klaus", "Otto", "Friedrich", "Karl", "Akira", "Hiroshi", "Takashi", "Kenji", "Yuji",
        "Tariq", "Khalil", "Samir", "Amir", "Raul", "Hugo", "Ivan", "Yuri", "Erick", "Kevin",
        "Bryan", "Ryan", "Patrick", "Oliver", "Sebastian", "Michel", "Jean", "Pierre", "Charles", "Denilson",
        "Edmilson", "Gilberto", "Josué", "Rivaldo", "Romário", "Zico", "Pelé", "Tostão", "Didi", "Garrincha",
        "Renato", "Maurício", "Fabiano", "Rogério", "Luciano", "Afonso", "Benedito", "Elias", "Ismael", "Isaac",
        "Jonas", "Josias", "Levi", "Natan", "Saulo", "Heitor", "Thales", "Ruan", "Breno", "Danilo",
        "Tales", "Sandro", "Mário", "César", "Alfredo", "Alberto", "Valentim", "Vicente", "Raul", "Moacir",
        "Davi", "Miguel", "Theo", "Gael", "Ravi", "Noah", "Benício", "Caleb", "Luan", "Kayky"
    ],
    "lastNames": [
        "Silva", "Santos", "Oliveira", "Souza", "Pereira", "Costa", "Carvalho", "Almeida", "Ferreira", "Rodrigues",
        "Gomes", "Martins", "Rocha", "Ribeiro", "Alves", "Monteiro", "Mendes", "Barros", "Freitas", "Barbosa",
        "Pinto", "Cardoso", "Teixeira", "Cavalcanti", "Dias", "Castro", "Campos", "Cardoso", "Fernandes", "Moreira",
        "Nascimento", "Lopes", "Soares", "Vieira", "Machado", "Nunes", "Batista", "Melo", "Borges", "Santana",
        "Rossi", "Ferrari", "Esposito", "Bianchi", "Romano", "Colombo", "Ricci", "Marino", "Greco", "Bruno",
        "Moretti", "Barbieri", "Lombardi", "Fontana", "Conti", "Galli", "Rizzo", "Mariani", "Coelho", "Vasconcelos",
        "Schmidt", "Müller", "Schneider", "Weber", "Wagner", "Becker", "Hoffmann", "Schulz", "Richter", "Koch",
        "Bauer", "Klein", "Wolf", "Schröder", "Neumann", "Sato", "Suzuki", "Takahashi", "Tanaka", "Watanabe",
        "Ito", "Yamamoto", "Nakamura", "Kobayashi", "Saito", "Mansur", "Haddad", "Maluf", "Temer", "Jereissati",
        "Assaf", "Nader", "Kuri", "Safi", "Said", "Azevedo", "Braga", "Correia", "Duarte", "Figueiredo",
        "Fonseca", "Guedes", "Leal", "Maia", "Moraes", "Neto", "Paiva", "Queiroz", "Ramos", "Sales",
        "Tavares", "Uchoa", "Viana", "Xavier", "Zogaib", "Abravanel", "Klabin", "Safra", "Setubal", "Villela",
        "Moura", "Andrade", "Dantas", "Pacheco", "Peixoto", "Guimarães", "Arruda", "Arantes", "Lacerda", "Chaves",
        "Bittencourt", "Drummond", "Espinosa", "Fagundes", "Galdino", "Hipólito", "Inácio", "Jardim", "Lira", "Meireles",
        "Noronha", "Ornellas", "Prado", "Quintana", "Resende", "Sampaio", "Toledo", "Ustra", "Valente", "Zanini"
    ]
},
    "Germany": {
    firstNames: [
        "Lukas", "Leon", "Noah", "Elias", "Finn", "Jonas", "Paul", "Ben", "Felix", "Max",
        "Moritz", "Tim", "Jan", "Niklas", "David", "Alexander", "Tobias", "Simon", "Florian", "Sebastian",
        "Michael", "Thomas", "Andreas", "Christian", "Daniel", "Matthias", "Stefan", "Marco", "Patrick", "Dominik",
        "Julian", "Philipp", "Kevin", "Marcel", "Dennis", "Nico", "Robin", "Fabian", "Lars", "Sven",
        "Mehmet", "Ali", "Mustafa", "Ahmet", "Hasan", "Hüseyin", "Murat", "Emre", "Ömer", "Burak",
        "Cem", "Deniz", "Eren", "Kerem", "Yusuf", "Ibrahim", "Ismail", "Malik", "Emir", "Adem",
        "Jakub", "Piotr", "Krzysztof", "Tomasz", "Marcin", "Kamil", "Dawid", "Mateusz", "Bartosz", "Adrian",
        "Wojciech", "Jan", "Marek", "Lukasz", "Michal", "Pawel", "Robert", "Rafal", "Grzegorz", "Artur",
        "Alexander", "Dmitri", "Andrei", "Sergej", "Vladimir", "Igor", "Yuri", "Maxim", "Nikolai", "Roman",
        "Viktor", "Alexei", "Mikhail", "Pavel", "Denis", "Artem", "Ivan", "Vadim", "Oleg", "Anton",
        "Alessandro", "Marco", "Luca", "Andrea", "Francesco", "Matteo", "Giuseppe", "Antonio", "Giovanni", "Roberto",
        "Stefano", "Paolo", "Carlo", "Davide", "Simone", "Fabio", "Lorenzo", "Riccardo", "Michele", "Giacomo",
        "Alexandros", "Georgios", "Dimitrios", "Konstantinos", "Nikolaos", "Christos", "Ioannis", "Panagiotis", "Vasilis", "Andras",
        "Mohammed", "Omar", "Hassan", "Khalid", "Tariq", "Karim", "Bilal", "Rami", "Samir", "Yasin",
        "Liam", "Daniel", "Samuel", "Gabriel", "Rafael", "Nathan", "Oscar", "Emil", "Anton", "Henry"
    ],
    lastNames: [
        "Müller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner", "Becker", "Schulz", "Hoffmann",
        "Schäfer", "Koch", "Bauer", "Richter", "Klein", "Wolf", "Schröder", "Neumann", "Schwarz", "Zimmermann",
        "Braun", "Krüger", "Hofmann", "Hartmann", "Lange", "Schmitt", "Werner", "Schmitz", "Krause", "Meier",
        "Lehmann", "Köhler", "Herrmann", "König", "Walter", "Mayer", "Huber", "Kaiser", "Fuchs", "Peters",
        "Lang", "Scholz", "Möller", "Weiß", "Jung", "Hahn", "Schubert", "Vogel", "Friedrich", "Keller",
        "Günther", "Frank", "Berger", "Winkler", "Roth", "Beck", "Lorenz", "Baumann", "Franke", "Albrecht",
        "Yılmaz", "Kaya", "Demir", "Şahin", "Çelik", "Yıldız", "Yıldırım", "Öztürk", "Aydın", "Özdemir",
        "Arslan", "Doğan", "Aslan", "Çetin", "Kara", "Koç", "Kurt", "Özkan", "Şimşek", "Erdoğan",
        "Polat", "Aksoy", "Güneş", "Kaplan", "Korkmaz", "Tekin", "Acar", "Bulut", "Tunç", "Karaca",
        "Kowalski", "Nowak", "Wiśniewski", "Wójcik", "Kowalczyk", "Kamiński", "Lewandowski", "Zieliński", "Szymański", "Woźniak",
        "Dąbrowski", "Kozłowski", "Jankowski", "Mazur", "Kwiatkowski", "Krawczyk", "Piotrowski", "Grabowski", "Nowakowski", 	"Pawłowski", "Ivanov", "Petrov", "Sidorov", "Smirnov", "Popov", "Volkov", "Sokolov", "Lebedev", "Kozlov", "Novikov",
        "Morozov", "Pavlov", "Fedorov", "Mikhailov", "Solovyov", "Vasiliev", "Kuznetsov", "Andreev", "Orlov", "Kovalev",
        "Rossi", "Russo", "Ferrari", "Esposito", "Bianchi", "Romano", "Colombo", "Ricci", "Marino", "Greco",
        "Bruno", "Gallo", "Conti", "De Luca", "Mancini", "Costa", "Giordano", "Rizzo", "Lombardi", "Moretti", "Papadopoulos", 	"Pappas", "Georgiou", "Dimitriou", "Nikolaidis", "Konstantinou", "Christodoulou", "Ioannou", "Petridis", "Vasileiou", 	"Hassan", "Ali", "Ahmed", "Hussein", "Khalil", "Mansour", "Saleh", "Hamid", "Mahmoud", "Nasser", "Silva", "Santos", 	"Rodriguez", "Garcia", "Martinez", "Lopez", "Hernandez", "Gonzalez", "Perez", "Sanchez"
    ]
},
    "France": {
    firstNames: [
        "Lucas", "Louis", "Hugo", "Nathan", "Arthur", "Gabriel", "Jules", "Léo", "Raphaël", "Tom",
        "Noah", "Ethan", "Mathis", "Adam", "Maxime", "Alexandre", "Antoine", "Pierre", "Paul", "Jean",
        "Nicolas", "Thomas", "Julien", "Kevin", "Romain", "Florian", "Clément", "Quentin", "Théo", "Baptiste",
        "Mathieu", "Benjamin", "Valentin", "Simon", "Adrien", "Aurélien", "Maxence", "Victor", "Charles", "Oscar",
        "Mohamed", "Mehdi", "Amine", "Youssef", "Karim", "Samir", "Bilal", "Sofiane", "Nassim", "Rayan",
        "Yanis", "Ibrahim", "Ilias", "Ismail", "Zakaria", "Ayoub", "Hamza", "Moussa", "Omar", "Issa",
        "Mamadou", "Ousmane", "Abdoulaye", "Seydou", "Ibrahima", "Bakary", "Amadou", "Souleymane", "Cheikh", "Lamine",
        "Moustapha", "Samba", "Boubacar", "Demba", "Aliou", "Modou", "Djibril", "Khadim", "Pape", "Malick",
        "Alexis", "Jordan", "Dylan", "Loïc", "Thibault", "Arnaud", "Geoffrey", "Jérémy", "William", "Sébastien",
        "David", "Marc", "Olivier", "Laurent", "François", "Christophe", "Philippe", "Patrick", "Stéphane", "Vincent",
        "Matteo", "Enzo", "Lorenzo", "Théo", "Nino", "Rafael", "Diego", "Léon", "Marius", "Sacha",
        "Amir", "Elias", "Noah", "Eden", "Naël", "Eliott", "Timéo", "Gabin", "Robin", "Axel",
        "Luca", "Pablo", "Émile", "Jules", "Augustin", "Antonin", "Gaspard", "Félix", "Côme", "Malo",
        "Samuel", "Daniel", "Emmanuel", "Michel", "Christian", "André", "Bernard", "Henri", "Alain", "Denis",
        "Yann", "Erwan", "Ronan", "Gwenaël", "Morgan", "Alan", "Tanguy", "Ewen", "Maël", "Louan"
    ],
    lastNames: [
        "Martin", "Bernard", "Dubois", "Thomas", "Robert", "Richard", "Petit", "Durand", "Leroy", "Moreau",
        "Simon", "Laurent", "Lefebvre", "Michel", "Garcia", "David", "Bertrand", "Roux", "Vincent", "Fournier",
        "Morel", "Girard", "André", "Lefèvre", "Mercier", "Dupont", "Lambert", "Bonnet", "François", "Martinez",
        "Legrand", "Garnier", "Faure", "Rousseau", "Blanc", "Guerin", "Muller", "Henry", "Roussel", "Nicolas",
        "Perrin", "Morin", "Mathieu", "Clément", "Gauthier", "Dumont", "Lopez", "Fontaine", "Chevalier", "Robin",
        "Masson", "Sanchez", "Gerard", "Nguyen", "Boyer", "Denis", "Lemaire", "Duval", "Joly", "Gautier",
        "Roger", "Roche", "Roy", "Noel", "Meyer", "Lucas", "Meunier", "Jean", "Perez", "Marchand",
        "Dufour", "Blanchard", "Marie", "Barbier", "Brun", "Dumas", "Brunet", "Schmitt", "Leroux", "Colin",
        "Fernandez", "Pierre", "Renard", "Arnaud", "Rolland", "Caron", "Aubert", "Giraud", "Leclerc", "Vidal",
        "Bourgeois", "Renaud", "Lemoine", "Picard", "Gaillard", "Philippe", "Leclercq", "Lacroix", "Fabre", "Dupuis",
        "Diallo", "Traoré", "Koné", "Touré", "Camara", "Cissé", "Diarra", "Bamba", "Keita", "Coulibaly",
        "Dembélé", "Sow", "Barry", "Sangaré", "Sissoko", "Konaté", "Fofana", "Diabaté", "Sidibé", "Doumbia",
        "Ben Ahmed", "Ben Ali", "Ben Salah", "Ziani", "Boukhari", "Mansouri", "Khelifi", "Khaled", "Belkacem", "Bouzid",
        "Alaoui", "Ouattara", "Kane", "Ndiaye", "Sarr", "Fall", "Gueye", "Sy", "Ba", "Seck",
        "Rodriguez", "Gonzalez", "Hernandez", "Silva", "Santos", "Oliveira", "Rossi", "Russo", "Romano", "Costa",
    ]
},
    "England": {
    firstNames: [
        "Jack", "Oliver", "Harry", "Charlie", "Thomas", "James", "William", "George", "Oscar", "Alfie",
        "Joshua", "Noah", "Jacob", "Daniel", "Henry", "Samuel", "Max", "Leo", "Ethan", "Alexander",
        "Benjamin", "Archie", "Lucas", "Isaac", "Joseph", "Edward", "Arthur", "Freddie", "Theo", "Logan",
        "Mason", "Harrison", "Finley", "Sebastian", "Adam", "Liam", "Dylan", "Zachary", "Toby", "Matthew",
        "Jake", "Lewis", "Tyler", "Ryan", "Nathan", "Callum", "Connor", "Jamie", "Luke", "Jordan",
        "Michael", "David", "Robert", "Christopher", "Andrew", "Paul", "Mark", "Richard", "Peter", "Simon",
        "Mohammed", "Muhammad", "Ahmed", "Ali", "Omar", "Yusuf", "Ibrahim", "Hamza", "Bilal", "Hassan",
        "Ismael", "Zayn", "Amir", "Rayan", "Adam", "Idris", "Haroon", "Imran", "Tariq", "Jamal",
        "Arjun", "Aiden", "Aarav", "Rohan", "Kiran", "Rahul", "Dev", "Ravi", "Nikhil", "Sanjay",
        "Aditya", "Anish", "Ashwin", "Vijay", "Sunil", "Rajesh", "Deepak", "Naveen", "Arun", "Pradeep",
        "Luca", "Marco", "Matteo", "Lorenzo", "Alessandro", "Francesco", "Luka", "Nikola", "Dimitri", "Stefan",
        "Jakub", "Piotr", "Kamil", "Mateusz", "Wojciech", "Adrian", "Dominik", "Bartosz", "Marcin", "Tomasz",
        "Samuel", "Ethan", "Elijah", "Owen", "Aaron", "Reuben", "Ezra", "Gabriel", "Caleb", "Nathaniel",
        "Jayden", "Tyrone", "Malik", "Isaiah", "Elijah", "Marcus", "Aaron", "Jordan", "Cameron", "Devin",
        "Leon", "Felix", "Emil", "Oskar", "Anton", "Maximilian", "Finn", "Levi", "Elias", "Jonas"
    ],
    lastNames: [
        "Smith", "Jones", "Williams", "Taylor", "Brown", "Davies", "Evans", "Wilson", "Thomas", "Roberts",
        "Johnson", "Walker", "Robinson", "Thompson", "White", "Hughes", "Edwards", "Green", "Hall", "Wood",
        "Harris", "Martin", "Jackson", "Clarke", "Lewis", "Lee", "Allen", "Scott", "King", "Wright",
        "Hill", "Cooper", "Ward", "Turner", "Morris", "Watson", "Baker", "Kelly", "Bennett", "Parker",
        "Cook", "Price", "Murray", "Rogers", "Stevens", "Phillips", "Morgan", "Bailey", "Bell", "Young",
        "Mitchell", "Carter", "Richardson", "Collins", "Cox", "Howard", "Shaw", "Ward", "Bennett", "Wood",
        "Ahmed", "Ali", "Khan", "Hussain", "Mahmood", "Hassan", "Shah", "Akhtar", "Malik", "Patel",
        "Rahman", "Choudhury", "Begum", "Islam", "Miah", "Uddin", "Alam", "Hossain", "Karim", "Aziz",
        "Singh", "Kumar", "Sharma", "Gupta", "Patel", "Kapoor", "Reddy", "Mehta", "Joshi", "Shah",
        "Verma", "Nair", "Iyer", "Rao", "Pillai", "Menon", "Bhatia", "Chopra", "Malhotra", "Khanna",
        "O'Brien", "Murphy", "Kelly", "Sullivan", "Walsh", "Ryan", "Doyle", "McCarthy", "Gallagher", "Doherty",
        "Kowalski", "Nowak", "Lewandowski", "Wojcik", "Kaminski", "Kowalczyk", "Zielinski", "Mazur", "Wisniewski", "Kubiak",
        "Popescu", "Ionescu", "Popa", "Stanescu", "Dumitrescu", "Georgescu", "Constantinescu", "Munteanu", "Stoica", "Diaconu",
        "Garcia", "Rodriguez", "Martinez", "Lopez", "Gonzalez", "Perez", "Fernandez", "Sanchez", "Silva", "Santos",
        "Novak", "Horvat", "Kovac", "Babic", "Petrovic", "Jovanovic", "Stojanovic", "Nikolic", "Popovic", "Marković", "Bellingham",
	"Wood", "Kane", "Redknap", "Smalling", "Johnson", "James", "Fry"
    ]
},
    "Spain": {
    firstNames: [
        "Alejandro", "Pablo", "Manuel", "Álvaro", "Adrián", "David", "Daniel", "Javier", "Sergio", "Carlos",
        "Miguel", "Rubén", "Iván", "Raúl", "Jorge", "Diego", "Antonio", "José", "Francisco", "Jesús",
        "Ángel", "Luis", "Pedro", "Fernando", "Alberto", "Víctor", "Roberto", "Enrique", "Rafael", "Gonzalo",
        "Hugo", "Martín", "Iker", "Marc", "Lucas", "Mario", "Pau", "Héctor", "Óscar", "Nicolás",
        "Marcos", "Juan", "Mateo", "Leo", "Thiago", "Gael", "Andrés", "Izan", "Aitor", "Unai",
        "Saúl", "Asier", "Yeray", "Mikel", "Jon", "Ander", "Iñaki", "Gorka", "Eneko", "Oier",
        "Mohamed", "Amine", "Youssef", "Omar", "Adam", "Ismael", "Ibrahim", "Hamza", "Bilal", "Ayoub",
        "Mehdi", "Karim", "Rayan", "Zakaria", "Ilias", "Imran", "Tariq", "Nabil", "Samir", "Anas",
        "Gabriel", "Samuel", "Matías", "Sebastián", "Emiliano", "Valentino", "Lautaro", "Benicio", "Tomás", "Felipe",
        "Rodrigo", "Santiago", "Joaquín", "Lorenzo", "Bruno", "Maximiliano", "Leonardo", "Facundo", "Santino", "Thiago",
        "Alexandru", "Andrei", "Bogdan", "Cristian", "Ionut", "Marius", "Mihai", "Nicolae", "Radu", "Stefan",
        "Adrian", "Florin", "Gabriel", "Gheorghe", "Ioan", "Laurentiu", "Petru", "Sorin", "Vasile", "Victor",
        "Chen", "Wei", "Li", "Zhang", "Wang", "Yang", "Liu", "Huang", "Lin", "Wu",
        "Jaime", "Ignacio", "Guillermo", "Emilio", "Ramón", "Salvador", "Esteban", "Germán", "Armando", "Julio",
        "César", "Vicente", "Agustín", "Mariano", "Cristóbal", "Mauricio", "Benjamín", "Emmanuel", "Alonso", "Ricardo"
    ],
    lastNames: [
        "García", "Rodríguez", "González", "Fernández", "López", "Martínez", "Sánchez", "Pérez", "Gómez", "Martín",
        "Jiménez", "Ruiz", "Hernández", "Díaz", "Moreno", "Álvarez", "Muñoz", "Romero", "Alonso", "Gutiérrez",
        "Navarro", "Torres", "Domínguez", "Vázquez", "Ramos", "Gil", "Ramírez", "Serrano", "Blanco", "Suárez",
        "Molina", "Morales", "Ortega", "Delgado", "Castro", "Ortiz", "Rubio", "Marín", "Sanz", "Iglesias",
        "Nuñez", "Medina", "Garrido", "Santos", "Castillo", "Cortés", "Lozano", "Guerrero", "Cano", "Prieto",
        "Méndez", "Cruz", "Flores", "Herrera", "Peña", "León", "Márquez", "Cabrera", "Gallego", "Calvo",
        "Vidal", "Campos", "Reyes", "Vega", "Fuentes", "Carrasco", "Díez", "Caballero", "Aguilar", "Nieto",
        "Santana", "Pascual", "Herrero", "Vargas", "Giménez", "Montero", "Hidalgo", "Ibáñez", "Lorenzo", "Santiago",
        "Mohamed", "Ahmed", "Ali", "Hassan", "Hussain", "Khan", "Mahmoud", "Rahman", "Abdi", "Omar",
        "El Amrani", "El Hajjaji", "El Ouardi", "Boukhris", "Benali", "Benkhaled", "Bouziane", "Chakir", "Driss", "Fadil",
        "Silva", "Santos", "Oliveira", "Pereira", "Costa", "Ferreira", "Rodrigues", "Alves", "Sousa", "Carvalho",
        "Gomes", "Martins", "Lopes", "Dias", "Ribeiro", "Mendes", "Rocha", "Nunes", "Correia", "Teixeira",
        "Popescu", "Ionescu", "Popa", "Stan", "Dumitrescu", "Stoica", "Constantin", "Munteanu", "Dinu", "Rusu",
        "Alves", "Sousa", "Carvalho", "Torres", "Palacios", "Pitarch", "Alba", "Arbeloa", "Giradoa", "Bixereta",
        "Gomes", "Martins", "Lopes", "Dias", "Ribeiro", "Mendes", "Rocha", "Nunes", "Correia", "Teixeira",
        "Popescu", "Ionescu", "Popa", "Stan", "Stoica", "Constantin", "Munteanu", "Dinu", "Rusu", "Matei",
        "Rossi", "Russo", "Ferrari", "Esposito", "Romano", "Colombo", "Bruno", "Ricci", "Marino", "Greco",
        "Vila", "Camps", "Soler", "Pujol", "Serra", "Font", "Roig", "Sala", "Valls", "Pons", "Bixente", "Xattarixa"
    ]
},
    "Italy": {
    firstNames: [
        "Alessandro", "Andrea", "Matteo", "Lorenzo", "Gabriele", "Mattia", "Luca", "Riccardo", "Francesco", "Davide",
        "Leonardo", "Federico", "Simone", "Marco", "Filippo", "Tommaso", "Pietro", "Edoardo", "Giuseppe", "Antonio",
        "Giovanni", "Stefano", "Paolo", "Carlo", "Roberto", "Michele", "Massimo", "Daniele", "Fabio", "Domenico",
        "Vincenzo", "Salvatore", "Emanuele", "Angelo", "Claudio", "Gianluca", "Alessio", "Christian", "Nicola", "Raffaele",
        "Samuele", "Cristian", "Manuel", "Giacomo", "Diego", "Nicolò", "Giulio", "Enrico", "Alberto", "Valentino",
        "Gabriel", "Samuel", "Daniel", "Michael", "Thomas", "David", "Kevin", "Liam", "Noah", "Lucas",
        "Mohamed", "Ahmed", "Ali", "Omar", "Youssef", "Adam", "Ibrahim", "Hassan", "Amine", "Bilal",
        "Hamza", "Ismael", "Karim", "Rayan", "Sofiane", "Mehdi", "Ayoub", "Imran", "Tariq", "Nabil",
        "Alexandru", "Andrei", "Stefan", "Gabriel", "Cristian", "Mihai", "Adrian", "Ionut", "Marius", "Bogdan",
        "Florin", "Daniel", "Nicolae, George", "Radu", "Vasile", "Constantin", "Sorin", "Valentin", "Laurentiu",
        "Chen", "Wei", "Ming", "Jun", "Hao", "Yang", "Jian", "Lei", "Li", "Feng",
        "Emmanuel", "Samuel", "Joseph", "Michael", "David", "Daniel", "Isaac", "Abraham", "Joshua", "Benjamin",
        "Marco", "Luka", "Nikola", "Ivan", "Petar", "Marko", "Mateo", "Luka", "Filip", "Josip",
        "Fabiano", "Giancarlo", "Giuliano", "Mauro", "Sergio", "Bruno", "Renato", "Luciano", "Marcello", "Armando",
        "Valerio", "Flavio", "Dario", "Mirko", "Denis", "Igor", "Ivan", "Yuri", "Alex", "Cristiano"
    ],
    lastNames: [
        "Rossi", "Russo", "Ferrari", "Esposito", "Bianchi", "Romano", "Colombo", "Ricci", "Marino", "Greco", "Terraciano", "Cirano",
        "Bruno", "Gallo", "Conti", "De Luca", "Mancini", "Costa", "Giordano", "Rizzo", "Lombardi", "Moretti", "Tedesco", "Gianino",
        "Barbieri", "Fontana", "Santoro", "Mariani", "Rinaldi", "Caruso", "Ferrara", "Galli", "Martini", "Leone", "Barelli", 	"Barella", "Buenafertura", "Buongiorno", "Tutti", "Totti", "Pirelli", "Gatto", "Diomande", "Di Angelo", "Di Matteo", "Di 	Marti", "Francesco", "Gianforte", "Rigazzali", "Ramazotti", "Zitardi", "Piodotti", "Pilanutti", "Villaniano", "Egliani",
        "Longo", "Gentile", "Martinelli", "Vitale", "Lombardo", "Serra", "Coppola", "De Santis", "D'Angelo", "Marchetti", "Maroni",
        "Parisi", "Villa", "Conte", "Ferraro", "Ferri", "Fabbri", "Bianco", "Marini", "Grasso", "Valentini", "Giglia", "Montaglia",
        "Messina", "Sala", "De Angelis", "Gatti", "Pellegrini", "Palumbo", "Sanna", "Farina", "Rizzi", "Monti", "Fontanelli", 
        "Cattaneo", "Morelli", "Amato", "Silvestri", "Mazza", "Testa", "Grassi", "Pellegrino", "Carbone", "Giuliani", "Portucci",
        "Benedetti", "Barone", "Rossetti", "Caputo", "Montanari", "Guerra", "Palmieri", "Bernardi", "Martino", "Fiore", "Gucci",
        "Mohamed", "Ahmed", "Ali", "Hassan", "Hussein", "Khalil", "Mahmoud", "Saleh", "Mansour", "Nasser", "Mariani", "Quintacci",
        "El Amrani", "Ben Ali", "Benali", "Bouzid", "Cherif", "Dridi", "Hammami", "Jebali", "Khelifi", "Mansouri", "Quaraglia",
        "Popescu", "Ionescu", "Popa", "Stan", "Stoica", "Dumitru", "Munteanu", "Constantin", "Rusu", "Dinu", "Potelli", "Canucci",
        "Marin", "Georgescu", "Stanescu", "Matei", "Vasile", "Tudor", "Ilie", "Mocanu", "Radu", "Cristea", "Mario", "Balotti",
        "Novak", "Horvat", "Kovac", "Petrovic", "Jovanovic", "Nikolic", "Popovic", "Djordjevic", "Ilic", "Pavlovic", "Giuppi"
    ]
},
    "Netherlands": {
    firstNames: [
        "Daan", "Sem", "Lucas", "Milan", "Levi", "Luuk", "Bram", "Finn", "Jesse", "Lars",
        "Thomas", "Tim", "Max", "Stijn", "Thijs", "Jan", "Ruben", "Noah", "Sven", "Niels",
        "Jasper", "Rick", "Kevin", "Joris", "Bart", "Jeroen", "Dennis", "Mike", "Tom", "Pieter",
        "Floris", "Mees", "Julian", "Sam", "Teun", "Gijs", "Jens", "Hugo", "Olivier", "Lars",
        "Robin", "Wouter", "Maarten", "Martijn", "Stefan", "Erik", "Mark", "Patrick", "Bas", "Sander",
        "Mohamed", "Ahmed", "Ali", "Omar", "Youssef", "Adam", "Ibrahim", "Hassan", "Bilal", "Hamza",
        "Ismail", "Ayoub", "Amine", "Mehdi", "Karim", "Rayan", "Zakaria", "Ilias", "Imran", "Tariq",
        "Murat", "Emre", "Eren", "Ahmet", "Mustafa", "Hasan", "Mehmet", "Burak", "Cem", "Deniz",
        "Emir", "Kerem", "Ömer", "Yusuf", "Can", "Kaan", "Barış", "Onur", "Serkan", "Fatih",
        "Piotr", "Jakub", "Mateusz", "Kamil", "Tomasz", "Marcin", "Wojciech", "Adrian", "Paweł", "Michał",
        "Arjun", "Rohan", "Dev", "Ravi", "Aditya", "Kiran", "Nikhil", "Rahul", "Sanjay", "Vijay",
        "Luca", "Marco", "Matteo", "Alessandro", "Lorenzo", "Francesco", "Andrea", "Davide", "Simone", "Stefano",
        "Alexander", "Daniel", "David", "Samuel", "Nathan", "Benjamin", "Gabriel", "Joshua", "Matthew", "Michael",
        "Chen", "Wei", "Ming", "Yang", "Hao", "Jun", "Lei", "Jian", "Feng", "Kai",
        "Jasper", "Pepijn", "Koen", "Luuk", "Ties", "Daniël", "Joost", "Casper", "Reinier", "Hidde"
    ],
    lastNames: [
        "de Jong", "Jansen", "de Vries", "van den Berg", "van Dijk", "Janssen", "Visser", "Smit", "Meijer", "van der Vliert",
        "de Boer", "Mulder", "de Groot", "Bos", "Vos", "Peters", "Hendriks", "van Leeuwen", "Dekker", "Brouwer", "van 't Schip",
        "de Wit", "Dijkstra", "Smits", "de Graaf", "van der Meer", "van der Linden", "Kok", "Jacobs", "de Haan", "Vermeulen",
        "van den Heuvel", "van der Veen", "van den Broek", "de Bruijn", "de Vos", "Koster", "Willems", "van Vliet", "Kuipers",
        "Huisman", "Prins", "Blom", "Kuiper", "van Dam", "Verhoeven", "Klaassen", "Mulder", "Scholten", "van der Wal", "Schouten",
        "Mohamed", "Ahmed", "Ali", "Hassan", "Abdi", "Omar", "Hussein", "Abdullahi", "Yusuf", "Ibrahim", "Wattimena", "Van Gerwen",
        "El Ouardi", "El Amrani", "Benali", "Boukhari", "Bouziane", "Cherif", "Driss", "Hamidi", "Idrissi", "Mansouri", "Van Veen",
        "Yilmaz", "Kaya", "Demir", "Şahin", "Çelik", "Yildiz", "Yildirim", "Öztürk", "Aydin", "Özdemir", "Smits", "Huitema",
        "Arslan", "Doğan", "Aslan", "Çetin", "Kara", "Koç", "Kurt", "Özkan", "Polat", "Erdoğan", "Becker", "Bakker", "Krips", "Bart",
        "Kowalski", "Nowak", "Wiśniewski", "Wójcik", "Kowalczyk", "Kamiński", "Lewandowski", "Zieliński", "Szymański", "Woźniak",
        "Patel", "Singh", "Kumar", "Sharma", "Gupta", "Khan", "Shah", "Ali", "Reddy", "Mehta", "van Rijn", "van de Wiel", "van Halen",
        "Popescu", "Ionescu", "Popa", "Stan", "Stoica", "Dumitru", "Munteanu", "Constantin", "Rusu", "Dinu", "de Bruin", "van Dijk",
        "Silva", "Santos", "Oliveira", "Pereira", "Costa", "Ferreira", "Rodrigues", "Alves", "Sousa", "Gomes", "Meerman", "Veerman",
        "van Beek", "van der Heide", "Hoekstra", "Bosch", "Vink", "Schouten", "de Lange", "van Wijk", "Koning", "van der Poel",
        "van Rijn", "van der Berg", "Timmermans", "Groen", "Jonker", "van Loon", "Kramer", "van der Heijden", "Driessen", "Maas",
        "Silva", "Santos", "Oliveira", "Pereira", "Costa", "Ferreira", "Rodrigues", "Alves", "Sousa", "Gomes", "Hartman", "Frants",
        "de Leeuw", "van Dalen", "Bosman", "Hermans", "van Os", "Mol", "Kloopmans", "Stam", "Lubbers", "Rietveld", "Huissen", 	"Koeman", "Blind", "Kaptijn", "Koen", "Graaneberg", "Kreeftman", "Hubers", "Stevens", "Kwado", "Propper", "Archaoui",
        "van Beek", "van der Heide", "Hoekstra", "Bosch", "Vink", "Schouten", "de Lange", "van Wijk", "Koning", "van der Poel"
    ]
},
    "Portugal": {
    firstNames: [
        "João", "Francisco", "Miguel", "Gonçalo", "Tomás", "Rodrigo", "Martim", "Pedro", "Tiago", "Diogo",
        "Rafael", "André", "Daniel", "Gabriel", "Bernardo", "Ricardo", "Bruno", "Nuno", "Hugo", "Rui",
        "Carlos", "José", "Manuel", "António", "Luís", "Paulo", "Marco", "Vasco", "Henrique", "Renato",
        "Afonso", "Duarte", "Guilherme", "Leonardo", "Lucas", "Mateus", "Samuel", "David", "Simão", "Dinis",
        "Rúben", "Fábio", "Filipe", "Jorge", "Sérgio", "Vítor", "Alexandre", "Fernando", "Mário", "Cristiano",
        "Joaquim", "Raul", "Alberto", "Eduardo", "Ivo", "Jaime", "Marcelo", "Nelson", "Orlando", "Roberto",
        "Santiago", "Artur", "Augusto", "César", "Davi", "Emanuel", "Heitor", "Enzo", "Igor", "Ivan",
        "Gustavo", "Caio", "Felipe", "Marcos", "Leandro", "Adriano", "Márcio", "Thiago", "Diego", "Kevin",
        "Denis", "Alex", "Erik", "Jonas", "Patrick", "Christian", "Dylan", "Ryan", "Joel", "Liam",
        "Mohamed", "Ahmed", "Ali", "Omar", "Youssef", "Ibrahim", "Hassan", "Bilal", "Amine", "Karim",
        "Ismael", "Hamza", "Adam", "Rayan", "Ayoub", "Mehdi", "Imran", "Tariq", "Nabil", "Samir",
        "Arjun", "Dev", "Ravi", "Kiran", "Nikhil", "Rohan", "Aditya", "Rahul", "Sanjay", "Vijay",
        "Chen", "Wei", "Ming", "Yang", "Hao", "Jun", "Lei", "Feng", "Kai", "Long",
        "Alexandru", "Andrei", "Cristian", "Gabriel", "Stefan", "Mihai", "Adrian", "Ionut", "Marius", "Bogdan",
        "Luca", "Marco", "Matteo", "Alessandro", "Lorenzo", "Andrea", "Davide", "Simone", "Fabio", "Stefano"
    ],
    lastNames: [
        "Silva", "Santos", "Ferreira", "Pereira", "Oliveira", "Costa", "Rodrigues", "Martins", "Jesus", "Sousa",
        "Fernandes", "Gonçalves", "Gomes", "Lopes", "Marques", "Alves", "Almeida", "Ribeiro", "Pinto", "Carvalho",
        "Teixeira", "Moreira", "Correia", "Mendes", "Nunes", "Soares", "Vieira", "Monteiro", "Cardoso", "Rocha",
        "Neves", "Coelho", "Cruz", "Cunha", "Pires", "Ramos", "Reis", "Simões", "Antunes", "Matos",
        "Fonseca", "Moura", "Barbosa", "Campos", "Freitas", "Castro", "Azevedo", "Dias", "Araújo", "Faria",
        "Machado", "Baptista", "Henriques", "Tavares", "Guerreiro", "Andrade", "Esteves", "Lima", "Barros", "Leite",
        "Pacheco", "Miranda", "Vaz", "Duarte", "Loureiro", "Magalhães", "Brito", "Carneiro", "Nogueira", "Vicente",
        "Lourenço", "Morais", "Amaral", "Valente", "Borges", "Domingues", "Maia", "Amorim", "Xavier", "Figueiredo",
        "Batista", "Guedes", "Gaspar", "Barreto", "Vidal", "Macedo", "Sá", "Branco", "Sampaio", "Cabral",
        "Mohamed", "Ahmed", "Ali", "Hassan", "Abdi", "Omar", "Hussein", "Ibrahim", "Yusuf", "Abdullahi",
        "Benali", "Bouzid", "Cherif", "El Amrani", "Hamidi", "Idrissi", "Khelifi", "Mansouri", "Ziani", "Driss",
        "Yilmaz", "Kaya", "Demir", "Öztürk", "Aydin", "Arslan", "Doğan", "Çelik", "Aslan", "Koç",
        "Rodrigo", "Pereira", "Aleixo", "Bastos", "Caetano", "Carmo", "Claro", "Delgado", "Estrada", "Franco",
        "Godinho", "Horta", "Lacerda", "Madeira", "Nascimento", "Oliveira", "Paiva", "Quaresma", "Rebelo", "Salgado"
    ]
},
    "Belgium": {
    firstNames: [
        "Lucas", "Nathan", "Noah", "Louis", "Arthur", "Gabriel", "Hugo", "Maxime", "Thomas", "Alexandre",
        "Jules", "Adam", "Raphaël", "Victor", "Mathis", "Léo", "Théo", "Antoine", "Simon", "Nicolas",
        "Mathieu", "Benjamin", "Julien", "Kevin", "Florian", "Romain", "Clément", "Quentin", "Valentin", "Adrien",
        "Tom", "Lars", "Liam", "Wout", "Sander", "Maarten", "Jens", "Bram", "Daan", "Pieter",
        "Jan", "Maxim", "Tibo", "Robbe", "Seppe", "Niels", "Jasper", "Stijn", "Koen", "Robin",
        "Axel", "Baptiste", "Ethan", "Matteo", "Sacha", "Oscar", "Felix", "Emile", "Gabin", "Marius",
        "Mohamed", "Ahmed", "Ali", "Omar", "Youssef", "Adam", "Ibrahim", "Hassan", "Bilal", "Hamza",
        "Amine", "Mehdi", "Karim", "Rayan", "Ismael", "Ayoub", "Zakaria", "Ilias", "Imran", "Tariq",
        "Murat", "Emre", "Ahmet", "Mustafa", "Mehmet", "Hasan", "Burak", "Cem", "Eren", "Can",
        "Piotr", "Jakub", "Mateusz", "Kamil", "Tomasz", "Marcin", "Adrian", "Wojciech", "Paweł", "Michał",
        "Luca", "Marco", "Matteo", "Alessandro", "Lorenzo", "Andrea", "Davide", "Francesco", "Simone", "Fabio",
        "David", "Samuel", "Daniel", "Michael", "Alexander", "Joshua", "Matthew", "Christopher", "William", "James",
        "Dylan", "Ryan", "Jordan", "Brandon", "Tyler", "Jason", "Justin", "Kyle", "Sean", "Brian",
        "Yannick", "Cédric", "Laurent", "Pierre", "Marc", "Vincent", "Olivier", "Philippe", "Sébastien", "François",
        "Guillaume", "Arnaud", "Thibault", "Alexis", "Loïc", "Jérôme", "Geoffrey", "Christophe", "Michaël", "Grégory"
    ],
    lastNames: [
        "Peeters", "Janssens", "Maes", "Jacobs", "Mertens", "Willems", "Claes", "Goossens", "Wouters", "De Smet",
        "De Cock", "Hermans", "Van de Velde", "Dubois", "Lambert", "Martin", "Simon", "Laurent", "Lefebvre", "Michel",
        "Van den Berg", "De Vries", "Bakker", "Smit", "Meijer", "De Boer", "Mulder", "Visser", "Hendriks", "Vermeulen",
        "Desmet", "Cools", "Bogaert", "Vandenberghe", "Stevens", "Pauwels", "De Wilde", "Baert", "Lemmens", "Michiels",
        "Dumont", "Bernard", "Thomas", "Robert", "Richard", "Petit", "Durand", "Leroy", "Moreau", "Fournier", "Joepmarx",
        "Garcia", "Martinez", "Rodriguez", "Fernandez", "Lopez", "Gonzalez", "Perez", "Sanchez", "Moreno", "Diaz", "Groenmaeghe",
        "Nguyen", "Tran", "Ngo", "Arbaeter", "Faerbroer", "Veldervoer", "Vanschuetter", "Luettaere", "Klaederman", "Veerwader",
        "Van Damme", "De Bruyne", "Verstraete", "Coppens", "Vandevelde", "Aerts", "Smeets", "Verlinden", "Van Acker", "Vandewalle",
        "El Amrani", "Benali", "Bouzid", "El Kaddouri", "Chakir", "Bouhaddou", "Hammoudi", "Naciri", "Oulhaj", "Sadiki",
        "Yilmaz", "Kaya", "Demir", "Şahin", "Çelik", "Öztürk", "Aydin", "Özdemir", "Arslan", "Doğan",
        "De Groote", "Vandenborre", "Vleminckx", "Verhoeven", "Saeys", "Geerts", "Devos", "Segers", "Nijs", "Claeys",
        "Lejeune", "François", "Gerard", "Denis", "Renard", "Collard", "André", "Picard", "Fontaine", "Colin", "Aerts", "Arxx", 	"Fraenx", "Saelemakers", "Krux", "van Impe", "Degenman", "Cubers", "Crux", "Franxx", "Xanter", "Grieks", "Groetter", "Baert",
        "Van Hoecke", "Thys", "Vanderschueren", "De Ridder", "Verhaeghe", "Pattyn", "Ceulemans", "Dewaele", "Heyvaert", "Bogaerts"
    ]
},
    "Argentina": {
    firstNames: [
        "Mateo", "Santiago", "Benjamín", "Matías", "Nicolás", "Tomás", "Thiago", "Lucas", "Joaquín", "Juan",
        "Valentín", "Bautista", "Agustín", "Felipe", "Martín", "Emiliano", "Lautaro", "Facundo", "Santino", "Lorenzo",
        "Francisco", "Gonzalo", "Ignacio", "Diego", "Rodrigo", "Maximiliano", "Sebastián", "Alejandro", "Gabriel", "Fernando",
        "Pablo", "Andrés", "Carlos", "Miguel", "Jorge", "Daniel", "Ricardo", "Marcelo", "Javier", "Eduardo",
        "Luciano", "Emanuel", "Bruno", "Ezequiel", "Axel", "Franco", "Damián", "Lionel", "Cristian", "Adrián",
        "Ramiro", "Mauro", "Claudio", "Sergio", "Gustavo", "Hernán", "Leandro", "Mariano", "Esteban", "Ezequiel",
        "Dylan", "Kevin", "Brian", "Jonathan", "Braian", "Maxi", "Nahuel", "Yamil", "Alexis", "Enzo",
        "Manuel", "Pedro", "Ángel", "Luis", "José", "Antonio", "Rubén", "Héctor", "Raúl", "Oscar",
        "Laureano", "Lisandro", "Tobías", "Iván", "Gastón", "Nicolás", "Lucio", "Alejo", "Octavio", "Dante",
        "Valentino", "Ian", "Gael", "Benicio", "Simón", "León", "Máximo", "Oliver", "Noah", "Liam",
        "Juan Cruz", "Juan Manuel", "Juan Martín", "Juan Pablo", "Juan Ignacio", "Juan José", "Juan Diego", "Juan Sebastián", "Juan Carlos", "Juan Pedro",
        "Fabricio", "Germán", "Nicolás", "Walter", "Omar", "Ariel", "Darío", "Guillermo", "Víctor", "Mauricio",
        "Nahuel", "Ulises", "Ramón", "Abel", "César", "Julio", "Mario", "Ernesto", "Alberto", "Roberto",
        "Elías", "Ismael", "Rafael", "Samuel", "Ezequiel", "Adriel", "Uriel", "Joel", "Nathaniel", "Emmanuel",
        "Cristóbal", "Augusto", "Valentín", "Emilio", "Lisandro", "Baltasar", "Gaspar", "Melchor", "Tadeo", "Silvio"
    ],
    lastNames: [
        "González", "Rodríguez", "Fernández", "García", "López", "Martínez", "Pérez", "Sánchez", "Romero", "Gómez",
        "Díaz", "Álvarez", "Castro", "Ruiz", "Moreno", "Molina", "Torres", "Ramírez", "Flores", "Benítez",
        "Acosta", "Medina", "Suárez", "Cabrera", "Ríos", "Silva", "Pereyra", "Guerrero", "Gutiérrez", "Navarro",
        "Vega", "Herrera", "Mendoza", "Vargas", "Campos", "Ramos", "Cardozo", "Muñoz", "Rojas", "Vera",
        "Sosa", "Ledesma", "Quiroga", "Godoy", "Miranda", "Domínguez", "Vázquez", "Aguilar", "Giménez", "Olivera",
        "Peralta", "Valdez", "Cortés", "Ibarra", "Luna", "Duarte", "Ponce", "Rivero", "Delgado", "Villalba",
        "Bravo", "Bustos", "Paredes", "Salazar", "Maldonado", "Ortiz", "Contreras", "Arias", "Figueroa", "Carrillo",
        "Escobar", "Coronel", "Méndez", "Benitez", "Correa", "Paz", "Santillán", "Juárez", "Franco", "Moyano",
        "Montes", "Reyes", "Leiva", "Cáceres", "Ávila", "Barrios", "Gallardo", "Robles", "Salas", "Sandoval",
        "Aguirre", "Carrasco", "Núñez", "Cuevas", "Espinoza", "Villanueva", "Iturbe", "Arce", "Caballero", "Montenegro",
        "Ruggeri", "Rossi", "Bianchi", "Russo", "Colombo", "Ferrari", "Bruno", "Gallo", "Lombardi", "Ricci",
        "Fernández", "López", "Rodríguez", "González", "Martínez", "Pérez", "García", "Sánchez", "Díaz", "Romero",
        "Vera", "Godoy", "Luna", "Vega", "Cáceres", "Ríos", "Rojas", "Sosa", "Benítez", "Acosta",
        "Da Silva", "Dos Santos", "De Oliveira", "Pereira", "Costa", "Ferreira", "Alves", "Sousa", "Ribeiro", "Cardoso",
        "Milanesi", "Santoro", "Greco", "Romano", "Mancini", "Villa", "Serra", "De Luca", "Vitale", "Marini"
    ]
},
    "Croatia": {
    firstNames: [
        "Luka", "Ivan", "Marko", "Matej", "Petar", "Josip", "Filip", "Ante", "Tomislav", "Dario",
        "Nikola", "Marin", "Hrvoje", "Zvonimir", "Dominik", "Stjepan", "Karlo", "David", "Leon", "Niko",
        "Jakov", "Fran", "Mateo", "Lovro", "Borna", "Roko", "Tin", "Toma", "Bruno", "Emanuel",
        "Antonio", "Mario", "Kristijan", "Davor", "Goran", "Zoran", "Slaven", "Drago", "Mladen", "Branko",
        "Miroslav", "Željko", "Krešimir", "Vedran", "Igor", "Domagoj", "Danijel", "Andrej", "Božidar", "Ivica",
        "Alen", "Ivo", "Dino", "Mate", "Adrian", "Liam", "Noah", "Noa", "Jan", "Viktor",
        "Adriano", "Lorenzo", "Alessandro", "Marco", "Matteo", "Luca", "Andrea", "Francesco", "Davide", "Simone",
        "Mohamed", "Ahmed", "Ali", "Omar", "Ibrahim", "Hassan", "Yusuf", "Adam", "Amin", "Bilal",
        "Jure", "Dorian", "Patrik", "Marijan", "Tihomir", "Vjekoslav", "Tomislav", "Dalibor", "Drazen", "Sinisa",
        "Grgur", "Juraj", "Mihael", "Rafael", "Gabriel", "Samuel", "Daniel", "Andrija", "Kruno", "Stipe",
        "Mislav", "Branimir", "Mirko", "Stanko", "Vinko", "Zdenko", "Jozo", "Franjo", "Slavko", "Stevo",
        "Toni", "Denis", "Robert", "Renato", "Sandro", "Saša", "Dean", "Dejan", "Darko", "Boris",
        "Zlatko", "Milan", "Nenad", "Vlatko", "Anto", "Duje", "Rino", "Fabio", "Leonardo", "Diego",
        "Erik", "Kevin", "Kristian", "Damjan", "Lovre", "Vito", "Neo", "Noel", "Leon", "Elias",
        "Gabrijel", "Sebastijan", "Bartol", "Fabijan", "Dominik", "Maksimilijan", "Bernard", "Valentin", "Oliver", "Emil"
    ],
    lastNames: [
        "Horvat", "Kovačević", "Babić", "Marić", "Novak", "Jurić", "Kovač", "Knežević", "Matić", "Pavlović",
        "Petrović", "Bošnjak", "Tomić", "Jović", "Pavić", "Šimić", "Radić", "Klarić", "Vidović", "Blažević",
        "Perić", "Vuković", "Lučić", "Mandić", "Krajnović", "Lovrić", "Galić", "Cvitković", "Barić", "Jakić",
        "Marković", "Jurković", "Filipović", "Vukelić", "Nikolić", "Antić", "Perković", "Stanić", "Jolić", "Barišić",
        "Ivančić", "Varga", "Šarić", "Rajić", "Dropulić", "Nikolić", "Josipović", "Andrić", "Kos", "Budimir",
        "Cvjetković", "Jukić", "Poljak", "Santini", "Vlahović", "Dragičević", "Rajković", "Matković", "Stanković", "Špoljar",
        "Zubčić", "Filipec", "Herceg", "Bilić", "Popović", "Milković", "Đurić", "Ćosić", "Borić", "Milić",
        "Janković", "Glamuzina", "Baković", "Zoričić", "Grgić", "Ivković", "Štefanić", "Radman", "Knez", "Martinović",
        "Vukić", "Horvat", "Barić", "Bogdan", "Rašić", "Dragović", "Ružić", "Ivić", "Jelić", "Kranjčević",
        "Zorić", "Šarac", "Vukasović", "Kolar", "Begić", "Katić", "Ivanović", "Cindrić", "Stojanović", "Majstorović",
        "Medved", "Jurinić", "Lovrenčić", "Majdandžić", "Šola", "Rebić", "Tomašević", "Tkalčić", "Vrbanić", "Žilić",
        "Rukavina", "Samardžić", "Bosnar", "Lasić", "Drežnjak", "Mikulić", "Pintarić", "Pleše", "Rogić", "Tadić",
        "Slišković", "Vučković", "Erceg", "Filipović", "Grgurić", "Ivančić", "Judaš", "Krišto", "Matijević", "Posavec",
        "Runje", "Smodlaka", "Šutalo", "Tolj", "Vrsaljko", "Župan", "Čizmić", "Čolak", "Đukić", "Šego",
        "Bakić", "Delić", "Galešić", "Hodak", "Kosor", "Leko", "Mihaljević", "Oršolić", "Perica", "Skelić"
    ]
},
    "Austria": {
    firstNames: [
        "Lukas", "Tobias", "David", "Felix", "Alexander", "Maximilian", "Julian", "Jakob", "Paul", "Leon",
        "Florian", "Simon", "Elias", "Noah", "Raphael", "Samuel", "Matthias", "Fabian", "Moritz", "Jonas",
        "Michael", "Thomas", "Daniel", "Stefan", "Christian", "Andreas", "Markus", "Philipp", "Sebastian", "Martin",
        "Patrick", "Manuel", "Dominik", "Benjamin", "Christoph", "Marco", "Nico", "Jan", "Tim", "Luca",
        "Mehmet", "Ali", "Murat", "Ahmet", "Mustafa", "Hasan", "Emre", "Ömer", "Burak", "Cem",
        "Kerem", "Deniz", "Eren", "Can", "Yusuf", "Ibrahim", "Ismail", "Emir", "Malik", "Adem",
        "Aleksandar", "Nikola", "Marko", "Stefan", "Ivan", "Luka", "Dusan", "Milan", "Dejan", "Nemanja",
        "Mohamed", "Ahmed", "Omar", "Hassan", "Bilal", "Rayan", "Karim", "Amine", "Imran", "Tariq",
        "Piotr", "Jakub", "Mateusz", "Kamil", "Tomasz", "Adrian", "Marcin", "Wojciech", "Paweł", "Dawid",
        "Nico", "Emil", "Anton", "Oskar", "Leopold", "Arthur", "Vincent", "Leonard", "Valentin", "Gabriel",
        "Franz", "Josef", "Johann", "Georg", "Karl", "Wolfgang", "Helmut", "Rudolf", "Herbert", "Otto",
        "Benedikt", "Clemens", "Constantin", "Friedrich", "Gregor", "Heinrich", "Lorenz", "Nikolaus", "Severin", "Theodor",
        "Alessandro", "Luca", "Matteo", "Marco", "Andrea", "Lorenzo", "Davide", "Simone", "Francesco", "Fabio",
        "Alexander", "Dimitri", "Sergej", "Igor", "Vladimir", "Andrei", "Maxim", "Roman", "Viktor", "Alexei",
        "Armin", "Artur", "Bruno", "Diego", "Elias", "Erik", "Gabriel", "Hugo", "Kilian", "Rafael"
    ],
    lastNames: [
        "Gruber", "Huber", "Wagner", "Müller", "Pichler", "Steiner", "Moser", "Mayer", "Hofer", "Leitner",
        "Berger", "Fuchs", "Eder", "Fischer", "Schmid", "Winkler", "Weber", "Schwarz", "Maier", "Schneider",
        "Reiter", "Mayr", "Schmidt", "Wimmer", "Egger", "Brunner", "Lang", "Bauer", "Auer", "Binder", "Ibisevic", "Grubermaier",
        "Lechner", "Wolf", "Wallner", "Aigner", "Ebner", "Koller", "Lehner", "Haas", "Schuster", "Arlt",
        "Yilmaz", "Kaya", "Demir", "Şahin", "Çelik", "Öztürk", "Yildiz", "Arslan", "Doğan", "Aydın", "Aichinger", "Altmaier",
        "Özdemir", "Aslan", "Çetin", "Kara", "Kurt", "Koç", "Özkan", "Polat", "Aksoy", "Erdoğan", "Franko", "Franco", "Koppman",
        "Horvat", "Kovačević", "Novak", "Marković", "Petrović", "Nikolić", "Jovanović", "Đorđević", "Stojanović", "Ilić",
        "Popović", "Pavlović", "Milošević", "Dimitrijević", "Todorović", "Živković", "Stanković", "Simić", "Kostić", "Marić",
        "Kowalski", "Nowak", "Wiśniewski", "Wójcik", "Kowalczyk", "Kamiński", "Lewandowski", "Zieliński", "Szymański", "Dąbrowski",
        "Graf", "Hoffmann", "Bauer", "Becker", "Koch", "Richter", "Klein", "Schröder", "Neumann", "Braun",
        "Zimmermann", "Hartmann", "Krüger", "Schmitt", "Werner", "Lange", "Meier", "Kaufmann", "Kaiser", "Schulze",
        "Rossi", "Russo", "Ferrari", "Esposito", "Bianchi", "Romano", "Colombo", "Ricci", "Marino", "Greco",
        "Ahmed", "Ali", "Hassan", "Hussein", "Khalil", "Mahmoud", "Rahman", "Mansour", "Nasser", "Saleh",
        "Ivanov", "Petrov", "Popov", "Sokolov", "Lebedev", "Kozlov", "Novikov", "Morozov", "Pavlov", "Fedorov",
        "Gruber", "Huber", "Plattner", "Rainer", "Keller", "Fink", "Maurer", "Berger", "Brandstätter", "Danzer"
    ]
},
   "USA": {
    firstNames: ["James", "Michael", "Robert", "John", "David", "William", "Richard", "Joseph", "Thomas", "Christopher", "Daniel", 	"Matthew", "Anthony", "Mark", "Donald", "Steven", "Andrew", "Joshua", "Kevin", "Brian"],
    lastNames: ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", 	"Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"]
},
   "Nigeria": {
    firstNames: ["Chukwuemeka", "Oluwaseun", "Chioma", "Adewale", "Ngozi", "Ikechukwu", "Folake", "Obinna", "Chiamaka", "Tunde", 	"Chinonso", "Yemi", "Oluwatobi", "Chinedu", "Bukola", "Emeka", "Funmi", "Chidi", "Segun", "Obi"],
    lastNames: ["Okafor", "Adeyemi", "Okonkwo", "Nwankwo", "Eze", "Okeke", "Adebayo", "Chikezie", "Oluwole", "Nwosu", "Onyekachi", 	"Ogunleye", "Nnamdi", "Okoli", "Chukwu", "Obi", "Adenuga", "Ikenna", "Olaniyan", "Udoka"]
},
   "Ghana": {
    firstNames: ["Kwame", "Kofi", "Yaw", "Akwasi", "Kwabena", "Kweku", "Ama", "Abena", "Akua", "Yaa", "Afia", "Kwadwo", "Fiifi", 	"Kojo", "Ekow", "Ebo", "Kobby", "Nana", "Kwesi", "Adjoa"],
    lastNames: ["Mensah", "Owusu", "Asante", "Boateng", "Agyeman", "Osei", "Acheampong", "Frimpong", "Appiah", "Amoako", "Adjei", 	"Danso", "Ofori", "Boakye", "Amponsah", "Ansah", "Gyasi", "Oteng", "Yeboah", "Opoku"]
},
   "South Africa": {
    firstNames: ["Sipho", "Thabo", "Mandla", "Bongani", "Themba", "Sello", "Kagiso", "Lerato", "Zanele", "Nomsa", "Thandi", "Mpho", 	"Lucas", "Johannes", "Pieter", "Andries", "Hendrik", "Johan", "Francois", "Willem"],
    lastNames: ["Nkosi", "Dlamini", "Khumalo", "Mthembu", "Zulu", "Ndlovu", "Mokoena", "Molefe", "Mkhize", "Radebe", "Van der Merwe", 	"Botha", "Pretorius", "Du Plessis", "Van Rensburg", "Steyn", "Fourie", "Nel", "De Wet", "Venter"]
},
   "Poland": {
    firstNames: ["Jakub", "Mateusz", "Kacper", "Szymon", "Wojciech", "Adam", "Paweł", "Piotr", "Krzysztof", "Tomasz", "Michał", 	"Kamil", "Dawid", "Łukasz", "Marcin", "Maciej", "Bartosz", "Grzegorz", "Artur", "Rafał"],
    lastNames: ["Nowak", "Kowalski", "Wiśniewski", "Wójcik", "Kowalczyk", "Kamiński", "Lewandowski", "Zieliński", "Szymański", 	"Woźniak", "Dąbrowski", "Kozłowski", "Jankowski", "Mazur", "Kwiatkowski", "Krawczyk", "Piotrowski", "Grabowski", "Nowakowski", 	"Pawłowski"]
},
   "Slovenia": {
    firstNames: ["Luka", "Jan", "Nik", "Filip", "Žiga", "Mark", "Matej", "Anže", "Tim", "Jaka", "Vid", "Nejc", "Rok", "Tilen", 	"Grega", "Blaž", "Marko", "Miha", "Matija", "Luka"],
    lastNames: ["Novak", "Horvat", "Krajnc", "Kovačič", "Zupančič", "Potočnik", "Vidmar", "Golob", "Božič", "Turk", "Kavčič", "Mrhar", 	"Kos", "Kastelic", "Lenarčič", "Bizjak", "Savnik", "Berlec", "Oblak", "Zajc"]
},
   "Serbia": {
    firstNames: ["Stefan", "Luka", "Nemanja", "Nikola", "Marko", "Aleksandar", "Miloš", "Filip", "Dušan", "Ivan", "Petar", "Milan", 	"Đorđe", "Jovan", "Vladimir", "Dragan", "Dejan", "Bojan", "Andrija", "Vuk"],
    lastNames: ["Jovanović", "Petrović", "Nikolić", "Marković", "Đorđević", "Stojanović", "Ilić", "Stanković", "Pavlović", 	"Milošević", "Todorović", "Simić", "Popović", "Dimitrijević", "Kostić", "Živković", "Vasić", "Mladenović", "Đukić", 	"Stefanović"]
},
   "Greece": {
    firstNames: ["Georgios", "Dimitrios", "Konstantinos", "Ioannis", "Nikolaos", "Panagiotis", "Christos", "Vasileios", "Andreas", 	"Alexandros", "Michail", "Athanasios", "Stefanos", "Apostolos", "Evangelos", "Theodoros", "Spyridon", "Petros", "Nikos", 	"Giorgos"],
    lastNames: ["Papadopoulos", "Papadakis", "Pappas", "Georgiou", "Dimitriou", "Nikolaou", "Ioannou", "Konstantinou", 	"Christodoulou", "Vasileiou", "Petridis", "Michalopoulos", "Angelopoulos", "Stavropoulos", "Vlahos", "Karagiannis", 	"Athanasiou", "Kouris", "Makris", "Economou"]
},
   "Turkey": {
    firstNames: ["Mehmet", "Mustafa", "Ahmet", "Ali", "Hüseyin", "Hasan", "İbrahim", "İsmail", "Yusuf", "Ömer", "Murat", "Emre", 	"Burak", "Cem", "Eren", "Can", "Deniz", "Kerem", "Barış", "Onur"],
    lastNames: ["Yılmaz", "Kaya", "Demir", "Şahin", "Çelik", "Yıldız", "Yıldırım", "Öztürk", "Aydın", "Özdemir", "Arslan", "Doğan", 	"Aslan", "Çetin", "Kara", "Koç", "Kurt", "Özkan", "Şimşek", "Erdoğan"]
},
   "Scotland": {
    firstNames: ["James", "Jack", "Lewis", "Logan", "Oliver", "Harris", "Callum", "Cameron", "Liam", "Andrew", "Alexander", "Ryan", 	"Dylan", "Jamie", "Ross", "Connor", "Kyle", "Finlay", "Ewan", "Fraser"],
    lastNames: ["Smith", "Brown", "Wilson", "Robertson", "Campbell", "Stewart", "Thomson", "Anderson", "MacDonald", "Scott", "Murray", 	"Miller", "Reid", "Ferguson", "Taylor", "Clark", "Ross", "Young", "Mitchell", "Watson"]
},
   "Ireland": {
    firstNames: ["Jack", "James", "Conor", "Sean", "Cian", "Liam", "Ryan", "Oisín", "Patrick", "Daniel", "Michael", "Darragh", 	"Cathal", "Finn", "Luke", "Adam", "Eoin", "Dylan", "Tadhg", "Cillian"],
    lastNames: ["Murphy", "Kelly", "O'Sullivan", "Walsh", "Smith", "O'Brien", "Byrne", "Ryan", "O'Connor", "O'Neill", "Reilly", 	"Doyle", "McCarthy", "Gallagher", "Doherty", "Kennedy", "Lynch", "Murray", "Quinn", "Moore"]
},
   "Denmark": {
    firstNames: ["Mikkel", "Mads", "Rasmus", "Mathias", "Frederik", "Nikolaj", "Simon", "Christian", "Andreas", "Jonas", "Lucas", 	"Oliver", "William", "Victor", "Emil", "Alexander", "Magnus", "Jacob", "Benjamin", "Sebastian"],
    lastNames: ["Nielsen", "Jensen", "Hansen", "Pedersen", "Andersen", "Christensen", "Larsen", "Sørensen", "Rasmussen", "Jørgensen", 	"Petersen", "Madsen", "Kristensen", "Olsen", "Thomsen", "Christiansen", "Poulsen", "Johansen", "Møller", "Mortensen"]
},
   "Sweden": {
    firstNames: ["Oscar", "William", "Lucas", "Elias", "Alexander", "Hugo", "Oliver", "Viktor", "Erik", "Emil", "Isak", "Axel", 	"Filip", "Anton", "Gustav", "Liam", "Noah", "Leo", "Adam", "Vincent"],
    lastNames: ["Andersson", "Johansson", "Karlsson", "Nilsson", "Eriksson", "Larsson", "Olsson", "Persson", "Svensson", "Gustafsson", 	"Pettersson", "Jonsson", "Jansson", "Hansson", "Bengtsson", "Jönsson", "Lindberg", "Jakobsson", "Magnusson", "Olofsson"]
},
   "Norway": {
    firstNames: ["Magnus", "Markus", "Mathias", "Jonas", "Tobias", "Emil", "Alexander", "Andreas", "Sebastian", "Henrik", "Kristian", 	"Fredrik", "Martin", "Jakob", "Sander", "Ole", "Lars", "Eirik", "Adrian", "Håkon"],
    lastNames: ["Hansen", "Johansen", "Olsen", "Larsen", "Andersen", "Pedersen", "Nilsen", "Kristiansen", "Jensen", "Karlsen", 	"Johnsen", "Pettersen", "Eriksen", "Berg", "Haugen", "Hagen", "Johannessen", "Andreassen", "Jacobsen", "Dahl"]
},
   "Iceland": {
    firstNames: ["Jón", "Guðmundur", "Sigurður", "Gunnar", "Ólafur", "Einar", "Kristján", "Magnús", "Stefán", "Þór", "Arnar", "Bjarni", "Dagur", "Emil", "Haukur", "Ívar", "Kári", "Ragnar", "Sindri", "Viktor"],
    lastNames: ["Jónsson", "Stefánsson", "Guðmundsson", "Sigurðsson", "Ólafsson", "Þórsson", "Einarsson", "Magnússon", "Gunnarsson", 	"Kristjánsson", "Arnarsson", "Bjarnason", "Halldórsson", "Pétursson", "Tryggvason", "Árnason", "Ingvarsson", "Þorsteinsson", 	"Baldursson", "Helgason"]
},
   "Colombia": {
    firstNames: ["Juan", "Carlos", "Andrés", "Luis", "José", "David", "Daniel", "Santiago", "Sebastián", "Camilo", "Alejandro", 	"Felipe", "Nicolás", "Diego", "Cristian", "Javier", "Miguel", "Pablo", "Jorge", "Manuel"],
    lastNames: ["Rodríguez", "García", "Martínez", "López", "González", "Hernández", "Pérez", "Sánchez", "Ramírez", "Torres", 	"Flores", "Rivera", "Gómez", "Díaz", "Cruz", "Morales", "Reyes", "Jiménez", "Gutiérrez", "Ruiz", "Palacios"]
},
   "Chile": {
    firstNames: ["Matías", "Sebastián", "Nicolás", "Benjamín", "Vicente", "Joaquín", "Tomás", "Martín", "Agustín", "Felipe", "Diego",    	"Cristóbal", "Ignacio", "Lucas", "Maximiliano", "Gabriel", "Santiago", "Andrés", "Manuel", "Francisco"],
    lastNames: ["González", "Muñoz", "Rojas", "Díaz", "Pérez", "Soto", "Contreras", "Silva", "Martínez", "Sepúlveda", "Morales", 	"Rodríguez", "López", "Fuentes", "Hernández", "Torres", "Araya", "Flores", "Espinoza", "Valenzuela"]
},
   "Uruguay": {
    firstNames: ["Mateo", "Santiago", "Nicolás", "Joaquín", "Benjamín", "Valentín", "Thiago", "Lucas", "Bautista", "Felipe", "Franco", 	"Agustín", "Tomás", "Facundo", "Bruno", "Emiliano", "Juan", "Sebastián", "Ignacio", "Diego"],
    lastNames: ["Rodríguez", "González", "Pérez", "Fernández", "García", "Martínez", "López", "Sánchez", "Hernández", "Díaz", "Silva", 	"Castro", "Álvarez", "Romero", "Suárez", "Torres", "Vázquez", "Benítez", "Ramírez", "Acosta"]
},
   "Czech Republic": {
    firstNames: ["Jakub", "Jan", "Tomáš", "Lukáš", "Matěj", "David", "Ondřej", "Petr", "Martin", "Filip", "Vojtěch", "Adam", "Michal", 	"Daniel", "Jiří", "Pavel", "Marek", "Václav", "Stanislav", "Karel"],
    lastNames: ["Novák", "Svoboda", "Novotný", "Dvořák", "Černý", "Procházka", "Kučera", "Veselý", "Horák", "Němec", "Pokorný", 	"Marek", "Pospíšil", "Hájek", "Jelínek", "Král", "Růžička", "Beneš", "Fiala", "Sedláček"]
},
   "Finland": {
    firstNames: ["Mikael", "Aleksi", "Ville", "Joonas", "Juho", "Eetu", "Arttu", "Samu", "Oskari", "Oliver", "Leo", "Onni", "Eino", 	"Väinö", "Emil", "Aatos", "Leevi", "Elias", "Luukas", "Matias"],
    lastNames: ["Korhonen", "Virtanen", "Mäkinen", "Nieminen", "Mäkelä", "Hämäläinen", "Laine", "Heikkinen", "Koskinen", "Järvinen", 	"Lehtonen", "Lehtinen", "Saarinen", "Salminen", "Heinonen", "Niemi", "Heikkilä", "Kinnunen", "Salonen", "Tuominen"]
},
   "Egypt": {
    firstNames: ["Mohamed", "Ahmed", "Mahmoud", "Ali", "Omar", "Youssef", "Khaled", "Hassan", "Amr", "Mostafa", "Karim", "Tamer", 	"Sherif", "Ibrahim", "Hossam", "Ayman", "Tarek", "Walid", "Samir", "Fadi"],
    lastNames: ["Mohamed", "Ahmed", "Ali", "Hassan", "Ibrahim", "Mahmoud", "Khalil", "Abdel Rahman", "Saad", "Salah", "Youssef", 	"Farouk", "Nasser", "Shawky", "El Sayed", "Abdelaziz", "Ramadan", "Ezz", "Morsi", "Fahmy"]
},
   "Morocco": {
    firstNames: ["Mohamed", "Ahmed", "Youssef", "Omar", "Hamza", "Adam", "Amine", "Mehdi", "Ayoub", "Zakaria", "Bilal", "Ismail", 	"Karim", "Rayan", "Hassan", "Yassine", "Samir", "Rachid", "Tarik", "Nabil"],
    lastNames: ["Alami", "Benjelloun", "El Amrani", "Benali", "Idrissi", "Zerouali", "El Hajjaji", "Bouhaddou", "Chakir", "Mansouri", 	"Khadri", "Naciri", "Oulhaj", "Sadiki", "Bouzid", "Benkirane", "Filali", "Tazi", "Cherkaoui", "Lahlou"]
},
   "Wales": {
    firstNames: ["Dylan", "Owen", "Rhys", "Evan", "Morgan", "Callum", "Joshua", "Jacob", "Oliver", "Ethan", "Thomas", "James", "Jack", 	"Liam", "Harry", "Connor", "Lewis", "Cian", "Gruffydd", "Tomos"],
    lastNames: ["Jones", "Williams", "Davies", "Evans", "Thomas", "Roberts", "Lewis", "Hughes", "Morgan", "Griffiths", "Edwards", 	"Rees", "Jenkins", "Owen", "Price", "Phillips", "Lloyd", "James", "Powell", "Watkins"]
},
   "Northern Ireland": {
    firstNames: ["James", "Jack", "Daniel", "Ryan", "Matthew", "Conor", "Adam", "Luke", "Nathan", "Ben", "Callum", "Thomas", "Liam", 	"Cian", "Sean", "Oisín", "Dylan", "Joshua", "Oliver", "Harry"],
    lastNames: ["Smith", "Johnston", "Wilson", "Thompson", "Campbell", "Stewart", "Robinson", "Moore", "Kelly", "Anderson", "Reid", 	"Murray", "Bell", "Watson", "Brown", "Martin", "McCann", "O'Neill", "Quinn", "Doherty"]
},
   "Canada": {
    firstNames: ["Liam", "Noah", "Oliver", "Lucas", "Jack", "Benjamin", "Owen", "Jacob", "Ethan", "William", "James", "Logan", 	"Alexander", "Matthew", "Daniel", "Michael", "Samuel", "Nathan", "Ryan", "Connor"],
    lastNames: ["Smith", "Brown", "Tremblay", "Martin", "Roy", "Wilson", "MacDonald", "Gagnon", "Johnson", "Taylor", "Côté", 	"Campbell", "Anderson", "Leblanc", "Lee", "Walker", "Patel", "Young", "Singh", "Wang"]
},
   "Mexico": {
    firstNames: ["José", "Luis", "Juan", "Carlos", "Miguel", "Jesús", "Antonio", "Pedro", "Alejandro", "Manuel", "Francisco", 	"Fernando", "Jorge", "Rafael", "Ricardo", "Daniel", "Eduardo", "Javier", "David", "Sergio"],
    lastNames: ["García", "Hernández", "Martínez", "López", "González", "Rodríguez", "Pérez", "Sánchez", "Ramírez", "Cruz", "Flores", 	"Gómez", "Díaz", "Morales", "Jiménez", "Reyes", "Torres", "Gutiérrez", "Ruiz", "Vázquez"]
},
   "Ecuador": {
    firstNames: ["Mateo", "Santiago", "Sebastián", "Nicolás", "Alejandro", "Diego", "Daniel", "Andrés", "Felipe", "Gabriel", "Carlos", 	"Juan", "David", "Luis", "José", "Miguel", "Jorge", "Pablo", "Fernando", "Cristian"],
    lastNames: ["García", "Rodríguez", "González", "Pérez", "López", "Martínez", "Sánchez", "Ramírez", "Torres", "Flores", "Rivera", 	"Gómez", "Díaz", "Cruz", "Morales", "Reyes", "Gutiérrez", "Ortiz", "Chávez", "Vásquez", "Pacheco"]
},
   "Peru": {
    firstNames: ["Luis", "Carlos", "José", "Juan", "Miguel", "Jorge", "Pedro", "Manuel", "Fernando", "Ricardo", "Diego", "Alejandro", 	"Daniel", "Andrés", "Sebastián", "Pablo", "Gabriel", "Ángel", "Eduardo", "Francisco"],
    lastNames: ["García", "Rodríguez", "López", "Pérez", "González", "Sánchez", "Ramírez", "Torres", "Flores", "Vásquez", "Castillo", 	"Romero", "Quispe", "Gutiérrez", "Chávez", "Díaz", "Mendoza", "Rojas", "Vargas", "Cruz"]
},
   "Australia": {
    firstNames: ["Oliver", "Jack", "Noah", "William", "Thomas", "James", "Lucas", "Henry", "Ethan", "Mason", "Liam", "Cooper", 	"Samuel", "Benjamin", "Charlie", "Alexander", "Max", "Daniel", "Harrison", "Logan"],
    lastNames: ["Smith", "Jones", "Williams", "Brown", "Wilson", "Taylor", "Johnson", "White", "Martin", "Anderson", "Thompson", 	"Nguyen", "Thomas", "Walker", "Harris", "Lee", "Ryan", "Robinson", "Kelly", "King"]
},
   "New Zealand": {
    firstNames: ["Oliver", "Jack", "Noah", "William", "James", "Mason", "Lucas", "Liam", "Benjamin", "Samuel", "Thomas", "Joshua", 	"Ethan", "Jacob", "Daniel", "Henry", "Alexander", "Matthew", "Cooper", "Hunter"],
    lastNames: ["Smith", "Wilson", "Taylor", "Brown", "Williams", "Jones", "Johnson", "Anderson", "Thomas", "Thompson", "Walker", 	"Campbell", "Martin", "Lee", "White", "Clark", "Young", "Harris", "Patel", "Singh"]
},
   "India": {
    firstNames: ["Arjun", "Aarav", "Rohan", "Aditya", "Karan", "Rahul", "Ravi", "Sanjay", "Vikram", "Amit", "Raj", "Dev", "Nikhil", 	"Suresh", "Pradeep", "Ashwin", "Vivek", "Manoj", "Krishna", "Ramesh"],
    lastNames: ["Sharma", "Gupta", "Singh", "Patel", "Kumar", "Reddy", "Shah", "Mehta", "Verma", "Joshi", "Iyer", "Nair", "Rao", 	"Kapoor", "Bhatia", "Chopra", "Malhotra", "Agarwal", "Bansal", "Desai"]
},
   "China": {
    firstNames: ["Wei", "Ming", "Jian", "Jun", "Yang", "Lei", "Hao", "Yong", "Tao", "Peng", "Chen", "Long", "Qiang", "Bin", "Xin", 	"Kai", "Gang", "Hui", "Feng", "Bo"],
    lastNames: ["Wang", "Li", "Zhang", "Liu", "Chen", "Yang", "Huang", "Zhao", "Wu", "Zhou", "Xu", "Sun", "Ma", "Zhu", "Hu", "Guo", 	"He", "Gao", "Lin", "Luo"]
},
   "Indonesia": {
    firstNames: ["Muhammad", "Ahmad", "Rizki", "Dimas", "Arif", "Budi", "Andi", "Agus", "Yoga", "Eko", "Hendra", "Rudi", "Bambang", 	"Joko", "Wawan", "Bayu", "Fajar", "Iwan", "Dwi", "Yusuf"],
    lastNames: ["Santoso", "Wijaya", "Kusuma", "Pratama", "Saputra", "Setiawan", "Nugroho", "Sari", "Wibowo", "Kurniawan", "Permana", 	"Utomo", "Hidayat", "Suryanto", "Hakim", "Gunawan", "Firmansyah", "Putra", "Rahman", "Abdullah"]
},
   "Japan": {
    firstNames: ["Yuki", "Takeshi", "Hiroshi", "Kenji", "Satoshi", "Masato", "Daisuke", "Ryo", "Shun", "Kazuki", "Haruto", "Sota", 	"Yuto", "Ren", "Kaito", "Hayato", "Ryota", "Kenta", "Tsubasa", "Sho"],
    lastNames: ["Sato", "Suzuki", "Takahashi", "Tanaka", "Watanabe", "Ito", "Yamamoto", "Nakamura", "Kobayashi", "Kato", "Yoshida", 	"Yamada", "Sasaki", "Yamaguchi", "Saito", "Matsumoto", "Inoue", "Kimura", "Hayashi", "Shimizu"]
},
   "DRC": {
    firstNames: ["Emmanuel", "Jean", "Joseph", "Pascal", "Claude", "Bienvenu", "Fiston", "Didier", "Jacques", "Patient", "Héritier", 	"Papy", "Glody", "Junior", "Merveille", "Grâce", "Espoir", "Prince", "Chance", "Beni"],
    lastNames: ["Kabila", "Tshisekedi", "Kasongo", "Mbuyi", "Nkulu", "Mutombo", "Ngoy", "Kalala", "Kayembe", "Ilunga", "Mukendi", 	"Banza", "Luamba", "Mwamba", "Kabeya", "Mukoko", "Ntumba", "Kabongo", "Mujinga", "Mulamba"]
},
   "Cameroon": {
    firstNames: ["Emmanuel", "Jean", "Paul", "Claude", "Michel", "Eric", "Patrick", "Blaise", "Martin", "Simon", "Alain", "Pierre", 	"André", "François", "Joseph", "Jacques", "Marcel", "Pascal", "Olivier", "Denis"],
    lastNames: ["Mbarga", "Nkoulou", "Ngono", "Essomba", "Abanda", "Etoa", "Manga", "Ebongue", "Mvondo", "Onana", "Fouda", "Nyemb", 	"Tchoua", "Atouba", "Kamdem", "Bekono", "Bella", "Mendomo", "Owona", "Ndoumbè"]
},
   "Kenya": {
    firstNames: ["John", "Peter", "David", "James", "Joseph", "Patrick", "Samuel", "Daniel", "Paul", "Michael", "Charles", "George", 	"Stephen", "Francis", "Anthony", "Moses", "Brian", "Kennedy", "Collins", "Dennis"],
    lastNames: ["Kamau", "Njoroge", "Ochieng", "Otieno", "Wanjiku", "Mwangi", "Kimani", "Kariuki", "Mutua", "Omondi", "Nganga", 	"Gitau", "Wambui", "Nyambura", "Maina", "Kibet", "Korir", "Kipchoge", "Cheruiyot", "Rotich"]
},
   "Algeria": {
    firstNames: ["Mohamed", "Ahmed", "Youcef", "Karim", "Amine", "Mehdi", "Raouf", "Bilal", "Hamza", "Walid", "Sofiane", "Nassim", 	"Abdallah", "Omar", "Yassine", "Rachid", "Farid", "Samir", "Khaled", "Hicham"],
    lastNames: ["Benali", "Bouzid", "Hamidi", "Khelifi", "Belkacem", "Cherif", "Mansouri", "Ziani", "Boukhari", "Naciri", "Meziani", 	"Larbi", "Amrani", "Benmohamed", "Djebbar", "Brahimi", "Bouabdallah", "Gherbi", "Sahraoui", "Khaled"]
},
   "Tunisia": {
    firstNames: ["Mohamed", "Ahmed", "Youssef", "Mehdi", "Amine", "Hamza", "Anis", "Bilal", "Karim", "Yassine", "Omar", "Aymen", 	"Malek", "Aziz", "Fares", "Oussama", "Rami", "Wassim", "Haythem", "Sami"],
    lastNames: ["Ben Ali", "Ben Salah", "Trabelsi", "Jebali", "Hamdi", "Gharbi", "Chebbi", "Miled", "Chakroun", "Dridi", "Oueslati", 	"Hammami", "Mejri", "Bouzaiene", "Kacem", "Labidi", "Chaibi", "Masmoudi", "Ayari", "Zaied"]
},
   "Madagascar": {
    firstNames: ["Toky", "Ando", "Mahery", "Fanilo", "Henintsoa", "Nirina", "Fidy", "Tiana", "Lova", "Miora", "Zo", "Faly", "Hasina", 	"Haja", "Jean", "Pierre", "Claude", "Patrick", "Christian", "Michel"],
    lastNames: ["Randrianarisoa", "Rakotomalala", "Rasoanaivo", "Andrianasolo", "Rakotondrabe", "Randrianasolo", "Raharison", 	"Rakotomavo", "Andriamampianina", "Rabemananjara", "Razafindrakoto", "Rajaonary", "Rajaonarivelo", "Rakotonirina", 	"Andrianaivo", "Rakotozafy", "Ramaroson", "Ranaivoson", "Razafindrabe", "Ratsimbazafy"]
},
   "Luxembourg": {
    firstNames: ["Tom", "Lucas", "Noah", "Liam", "Felix", "Max", "Paul", "Louis", "Arthur", "Jules", "Alex", "Marc", "Jean", "Pierre", 	"Michel", "Claude", "Patrick", "Laurent", "Nicolas", "David"],
    lastNames: ["Schmit", "Weber", "Muller", "Klein", "Becker", "Hoffmann", "Schumann", "Wagner", "Mayer", "Kremer", "Hansen", 	"Kieffer", "Jung", "Simon", "Reuter", "Wolf", "Zimmer", "Scholtes", "Meyers", "Pletschette"]
},
   "Albania": {
    firstNames: ["Andi", "Erion", "Enea", "Ardit", "Denis", "Klajdi", "Elton", "Gjergj", "Besnik", "Agron", "Ilir", "Alban", "Blerim", 	"Dritan", "Gentian", "Arben", "Fatmir", "Petrit", "Shpetim", "Valmir"],
    lastNames: ["Hoxha", "Krasniqi", "Berisha", "Gashi", "Hyseni", "Ahmeti", "Morina", "Osmani", "Shala", "Hasani", "Rexhepi", 	"Bajrami", "Kelmendi", "Salihi", "Isufi", "Kastrati", "Memishi", "Tahiri", "Gjoni", "Dervishi"]
},
   "Kosovo": {
    firstNames: ["Ardit", "Arben", "Bekim", "Driton", "Fisnik", "Gentrit", "Ilir", "Liridon", "Mergim", "Shkelzen", "Trim", "Valon", 	"Ardian", "Blerim", "Fatmir", "Kushtrim", "Labinot", "Meriton", "Rinor", "Visar"],
    lastNames: ["Krasniqi", "Berisha", "Gashi", "Shala", "Osmani", "Morina", "Kelmendi", "Ahmeti", "Bajrami", "Hasani", "Rexhepi", 	"Salihi", "Kastrati", "Tahiri", "Hoxha", "Hyseni", "Isufi", "Latifi", "Mehmeti", "Musliu"]
},
   "North Macedonia": {
    firstNames: ["Stefan", "Aleksandar", "Nikola", "Marko", "Filip", "Dimitar", "Gjorgji", "Viktor", "Bojan", "Igor", "Darko",  	"Zoran", "Dejan", "Petar", "Trajko", "Slave", "Metodija", "Ilija", "Goce", "Vasil"],
    lastNames: ["Petrov", "Nikolov", "Stojanov", "Georgiev", "Trajkovski", "Dimitrov", "Arsovski", "Ilievski", "Jovanov", "Velkovski", 	"Stankov", "Todorov", "Mitrev", "Petkovski", "Angelovski", "Kostov", "Ristovski", "Zdravkovski", "Bogoevski", "Stefanov"]
},
   "Ukraine": {
    firstNames: ["Oleksandr", "Andriy", "Dmytro", "Sergiy", "Volodymyr", "Ivan", "Yuriy", "Viktor", "Oleh", "Maksym", "Vasyl", 	"Mykola", "Pavlo", "Taras", "Roman", "Artem", "Denys", "Bohdan", "Illya", "Ruslan"],
    lastNames: ["Melnyk", "Kovalenko", "Bondarenko", "Boyko", "Koval", "Tkachenko", "Kravchenko", "Oliynyk", "Shevchenko", 	"Kovalchuk", "Polishchuk", "Lysenko", "Rudenko", "Savchenko", "Marchenko", "Moroz", "Mykhaylenko", "Pavlenko", "Petrenko", 	"Romanenko"]
},
   "Romania": {
    firstNames: ["Andrei", "Alexandru", "Mihai", "Ion", "Cristian", "Marius", "Adrian", "Bogdan", "Florin", "Gabriel", "Ionut", 	"Nicolae", "Radu", "Stefan", "Vasile", "Constantin", "Dan", "George", "Gheorghe", "Laurentiu"],
    lastNames: ["Popescu", "Ionescu", "Popa", "Stan", "Stoica", "Dumitru", "Munteanu", "Constantin", "Rusu", "Dinu", "Matei", 	"Georgescu", "Stanescu", "Vasile", "Tudor", "Ilie", "Mocanu", "Radu", "Cristea", "Marin"]
},
   "Bulgaria": {
    firstNames: ["Georgi", "Ivan", "Dimitar", "Nikolay", "Petar", "Stanislav", "Todor", "Vasil", "Hristo", "Aleksandar", "Boyan", 	"Kaloyan", "Mihail", "Plamen", "Rosen", "Simeon", "Stefan", "Tsvetan", "Viktor", "Vladislav"],
    lastNames: ["Ivanov", "Georgiev", "Dimitrov", "Petrov", "Nikolov", "Stoyanov", "Iliev", "Todorov", "Vasilev", "Hristov", 	"Yordanov", "Angelov", "Kolev", "Marinov", "Atanasov", "Aleksandrov", "Stefanov", "Kostov", "Apostolov", "Borisov"]
},
   "Hungary": {
    firstNames: ["László", "István", "Zoltán", "Gábor", "Péter", "András", "János", "Tamás", "Attila", "Zsolt", "Balázs", "Dániel", 	"Máté", "Ádám", "Bence", "Levente", "Márk", "Patrik", "Richárd", "Viktor"],
    lastNames: ["Nagy", "Kovács", "Tóth", "Szabó", "Horváth", "Varga", "Kiss", "Molnár", "Németh", "Farkas", "Balogh", "Papp", 	"Takács", "Juhász", "Lakatos", "Mészáros", "Oláh", "Simon", "Rácz", "Fekete", "György"]
},
   "Slovakia": {
    firstNames: ["Ján", "Peter", "Michal", "Martin", "Tomáš", "Marek", "Matej", "Jakub", "Lukáš", "Pavol", "Stanislav", "Miroslav", 	"Vladimír", "Jozef", "Ladislav", "Milan", "Roman", "Štefan", "Zdenko", "Andrej"],
    lastNames: ["Varga", "Horváth", "Tóth", "Baláž", "Molnár", "Kováč", "Nagy", "Takács", "Farkas", "Szabó", "Kiss", "Oláh", "Fekete", 	"Gál", "Lukáč", "Simon", "Balogh", "Papp", "Mészáros", "Antal"]
},
   "Bosnia": {
    firstNames: ["Mirza", "Emir", "Amir", "Adnan", "Sead", "Nermin", "Amer", "Senad", "Samir", "Kenan", "Dino", "Haris", "Tarik", 	"Denis", "Almir", "Armin", "Faruk", "Jasmin", "Nedim", "Zlatan"],
    lastNames: ["Mehmedović", "Mustafić", "Hodžić", "Hadžić", "Begović", "Softić", "Smajlović", "Imamović", "Šehić", "Jusufović", 	"Omanović", "Alibašić", "Delić", "Hasanović", "Salihović", "Aličković", "Halilović", "Isaković", "Kovačević", "Jovanović"]
},
   "South Korea": {
    firstNames: ["Min-jun", "Seo-jun", "Do-yoon", "Si-woo", "Ji-ho", "Jun-seo", "Ye-jun", "Jae-won", "Hyun-woo", "Jin-woo", "Seung-	hyun", "Ji-hoon", "Min-ho", "Tae-yang", "Dong-hyun", "Sang-woo", "Joon-ho", "Kyung-soo", "Young-jae", "Woo-jin"],
    lastNames: ["Kim", "Lee", "Park", "Choi", "Jung", "Kang", "Cho", "Yoon", "Jang", "Lim", "Han", "Oh", "Seo", "Shin", "Kwon", 	"Hwang", "Ahn", "Song", "Hong", "Yang"]
},
   "Iraq": {
    firstNames: ["Mohammed", "Ahmed", "Ali", "Hussein", "Hassan", "Omar", "Mustafa", "Karim", "Youssef", "Ammar", "Haider", "Hadi", 	"Noor", "Alaa", "Zain", "Khalid", "Qasim", "Rami", "Tariq", "Walid"],
    lastNames: ["Al-Saadi", "Al-Maliki", "Al-Hashimi", "Al-Jumaili", "Al-Dulaimi", "Al-Tikrit", "Al-Shammari", "Al-Obeidi", "Al-	Kubaisi", "Al-Janabi", "Al-Azzawi", "Al-Bayati", "Al-Douri", "Al-Mashhadani", "Al-Rawi", "Al-Samarrai", "Al-Hamdani", "Al-	Qaisi", "Al-Tamimi", "Al-Zubaydi"]
},
   "Kazakhstan": {
    firstNames: ["Arman", "Damir", "Yerlan", "Timur", "Nurlan", "Askar", "Serik", "Daniyar", "Alibek", "Ruslan", "Erbol", "Murat", 	"Kanat", "Baurzhan", "Azamat", "Sanzhar", "Dias", "Rauan", "Aibek", "Bekzat"],
    lastNames: ["Nurmagambetov", "Akhmetov", "Suleimenov", "Karimov", "Abdulov", "Ismailov", "Bekbossynov", "Mamedov", "Sarsenov", 	"Zhakupov", "Tursynov", "Omarov", "Mukanov", "Kassymov", "Baimukhanov", "Dzhumabayev", "Kenzhebayev", "Nurpeisov", "Sultanov", 	"Yessenov"]
},
   "Côte d'Ivoire": {
    firstNames: ["Kouadio", "Kouassi", "Konan", "Yao", "N'Guessan", "Koffi", "Akissi", "Aya", "Adjoua", "Amoin", "Ibrahim", 	"Aboubacar", "Mamadou", "Ousmane", "Seydou", "Adama", "Moussa", "Bakary", "Issouf", "Lassina"],
    lastNames: ["Yao", "Koné", "Kouassi", "Traoré", "Touré", "Coulibaly", "Bamba", "Diallo", "Ouattara", "Sangaré", "N'Guessan", 	"Konan", "Koffi", "Camara", "Doumbia", "Gbagbo", "Silué", "Diabaté", "Konaté", "Fofana"]
},
   "Senegal": {
    firstNames: ["Moussa", "Mamadou", "Ibrahima", "Ousmane", "Cheikh", "Abdoulaye", "Amadou", "Saliou", "Modou", "Aliou", "Pape", 	"Lamine", "Babacar", "Khadim", "Malick", "Samba", "Demba", "Mbacke", "Baye", "Omar"],
    lastNames: ["Diop", "Ndiaye", "Fall", "Sy", "Sarr", "Sow", "Diallo", "Gueye", "Mbaye", "Diouf", "Ba", "Thiam", "Cissé", "Faye", 	"Kane", "Seck", "Ndao", "Touré", "Keita", "Dieng"]
},
   "Mali": {
    firstNames: ["Mamadou", "Abdoulaye", "Ibrahim", "Moussa", "Ousmane", "Seydou", "Adama", "Amadou", "Boubacar", "Souleymane", 	"Cheick", "Modibo", "Lassine", "Drissa", "Mahamadou", "Youssouf", "Issa", "Bakary", "Hamadou", "Moustapha"],
    lastNames: ["Traoré", "Coulibaly", "Diarra", "Koné", "Touré", "Sangaré", "Keita", "Sissoko", "Dembélé", "Cissé", "Diallo", 	"Maïga", "Konaté", "Fofana", "Bamba", "Sidibé", "Diabaté", "Camara", "Doumbia", "Guindo"]
},
   "Gambia": {
    firstNames: ["Lamin", "Omar", "Modou", "Bakary", "Ebou", "Sulayman", "Muhammed", "Ousman", "Ebrima", "Abdoulie", "Musa", "Alieu", 	"Buba", "Saikou", "Mamadou", "Momodou", "Dawda", "Kebba", "Pa", "Yankuba"],
    lastNames: ["Jallow", "Ceesay", "Sanyang", "Jammeh", "Jatta", "Sanneh", "Manneh", "Bah", "Colley", "Darboe", "Barrow", "Bojang", 	"Sowe", "Camara", "Touray", "Fatty", "Baldeh", "Fofana", "Drammeh", "Njie"]
},
   "Gabon": {
    firstNames: ["Christian", "Serge", "Patrick", "François", "Jean", "Pierre", "Emmanuel", "Marcel", "André", "Claude", "Guy", 	"Yves", "Jacques", "Michel", "Paul", "Joseph", "Daniel", "Marc", "Alain", "Eric"],
    lastNames: ["Obame", "Nguema", "Mba", "Ondo", "Moussavou", "Mintsa", "Essono", "Ella", "Nze", "Ovono", "Mabika", "Bekale", 	"Bivigou", "Boussougou", "Kombila", "Meye", "Ndong", "Ntoutoume", "Oyono", "Zang"]
},
   "Liechtenstein": {
    firstNames: ["Marco", "Daniel", "Michael", "Thomas", "Andreas", "Philipp", "David", "Patrick", "Christian", "Stefan", "Matthias", 	"Simon", "Tobias", "Markus", "Lukas", "Sebastian", "Florian", "Nicolas", "Alexander", "Benjamin"],
    lastNames: ["Büchel", "Hasler", "Frick", "Biedermann", "Quaderer", "Ritter", "Vogt", "Wanger", "Kaiser", "Marxer", "Meier", 	"Nigg", "Beck", "Wolfinger", "Sprenger", "Lampert", "Schädler", "Ospelt", "Frommelt", "Banzer"]
},
   "Uganda": {
    firstNames: ["Moses", "David", "John", "Isaac", "Samuel", "Joseph", "Daniel", "Patrick", "Paul", "Emmanuel", "Brian", "Ronald", 	"Peter", "Andrew", "James", "Richard", "Robert", "Martin", "Charles", "Steven"],
    lastNames: ["Mugisha", "Kamau", "Ssemakula", "Okello", "Musoke", "Katende", "Nabwire", "Namukasa", "Ochieng", "Kato", "Mubiru", 	"Namutebi", "Wasswa", "Babirye", "Tumusiime", "Nakato", "Kizza", "Lubega", "Ssentongo", "Kisakye"]
},
   "Rwanda": {
    firstNames: ["Jean", "Paul", "Emmanuel", "Claude", "Eric", "Patrick", "Innocent", "Faustin", "Théophile", "François", "Damien", 	"Janvier", "Celestin", "Alphonse", "Bosco", "Sylvestre", "Augustin", "Félicien", "Védaste", "Pacifique"],
    lastNames: ["Niyonzima", "Habimana", "Uwimana", "Mugisha", "Nshimiyimana", "Bizimana", "Ndayisaba", "Nsengiyumva", "Hakizimana", 	"Ntawukuriryayo", "Hategekimana", "Niyonshuti", "Muhawenimana", "Nkurunziza", "Gasana", "Kagame", "Mutabazi", "Nyiraneza", 	"Uwiragiye", "Kamanzi"]
},
   "Armenia": {
    firstNames: ["Armen", "Tigran", "Aram", "Hovhannes", "Hayk", "Davit", "Vahagn", "Narek", "Artashes", "Grigor", "Karen", "Levon", 	"Sargis", "Vardan", "Samvel", "Arman", "Gevorg", "Raffi", "Artur", "Edgar"],
    lastNames: ["Sargsyan", "Khachatryan", "Hovhannisyan", "Grigoryan", "Petrosyan", "Harutyunyan", "Mkrtchyan", "Vardanyan", 	"Poghosyan", "Abrahamyan", "Manukyan", "Asatryan", "Karapetyan", "Davtyan", "Martirosyan", "Hakobyan", "Sahakyan", 	"Gevorgyan", "Danielyan", "Baghdasaryan"]
},
   "Georgia": {
    firstNames: ["Giorgi", "Davit", "Luka", "Nikoloz", "Aleksandre", "Irakli", "Levan", "Tornike", "Saba", "Nika", "Guga", "Lasha", 	"Vakhtang", "Zurab", "Mamuka", "Gela", "Gigi", "Tengiz", "Malkhaz", "Revaz"],
    lastNames: ["Beridze", "Gelashvili", "Kapanadze", "Kvachantiradze", "Lomidze", "Maisuradze", "Meparishvili", "Nikolaishvili", 	"Orjonikidze", "Pachulia", "Qobuladze", "Rcheulishvili", "Shengelia", "Tsereteli", "Ugulava", "Vashakidze", "Zaalishvili", 	"Dzneladze", "Chkheidze", "Kvaratskhelia", "Sigua"]
},
   "Cyprus": {
    firstNames: ["Andreas", "Georgios", "Christos", "Constantinos", "Dimitrios", "Panayiotis", "Michalis", "Nikos", "Stelios", 	"Marios", "Costas", "Savvas", "Antonis", "Yiannis", "Philippos", "Petros", "Pavlos", "Stavros", "Charalambos", "Kyriakos"],
    lastNames: ["Georgiou", "Charalambous", "Christodoulou", "Dimitriou", "Constantinou", "Nicolaou", "Andreou", "Stylianou", "Kyriakides", "Papadopoulos", "Loizou", "Michael", "Savva", "Ioannou", "Hadjiconstantinou", "Gregoriou", "Antoniou", "Neophytou", "Chrysostomou", "Theodorou"]
}
};

// Nationality distribution based on national team strength
// Includes ALL 69 countries from NAMES_DATABASE with realistic weights
const NATIONALITY_DISTRIBUTION = {
    // Tier 1: World-class (25%)
    "Brazil": 5,
    "Germany": 4,
    "France": 4,
    "Spain": 4,
    "England": 4,
    "Argentina": 4,
    
    // Tier 2: Top European + Strong SA (30%)
    "Italy": 3.5,
    "Netherlands": 3.5,
    "Portugal": 3,
    "Belgium": 3,
    "Croatia": 2.5,
    "Switzerland": 2.5,
    "Uruguay": 2,
    "Colombia": 2,
    "Mexico": 2,
    "Denmark": 1.5,
    "Austria": 1.5,
    "Sweden": 1.5,
    
    // Tier 3: Good European (25%)
    "Poland": 2,
    "Ukraine": 2,
    "Turkey": 2,
    "Czech Republic": 1.5,
    "Serbia": 1.5,
    "Romania": 1.5,
    "Greece": 1.5,
    "Hungary": 1.5,
    "Norway": 1.2,
    "Scotland": 1.2,
    "Wales": 1,
    "Ireland": 1,
    "Slovakia": 1,
    "Slovenia": 1,
    "Bulgaria": 0.8,
    "Bosnia": 0.8,
    
    // Tier 4: Emerging/Others (20%)
    "Japan": 1.5,
    "Morocco": 1.5,
    "Senegal": 1.2,
    "Egypt": 1.2,
    "Algeria": 1.2,
    "Nigeria": 1.2,
    "Ghana": 1,
    "Cameroon": 1,
    "Tunisia": 0.8,
    "Ecuador": 0.8,
    "Chile": 0.8,
    "Peru": 0.8,
    "Australia": 0.7,
    "Canada": 0.7,
    "Finland": 0.6,
    "Albania": 0.6,
    "Georgia": 0.6,
    "Kosovo": 0.6,
    "Iceland": 0.5,
    "Armenia": 0.4,
    "Kazakhstan": 0.3,
    "China": 0.3,
    "India": 0.3,
    "Indonesia": 0.3,
    "Iraq": 0.3,
    "Kenya": 0.2,
    "Uganda": 0.2,
    "Rwanda": 0.2,
    "Mali": 0.2,
    "Gabon": 0.2,
    "Gambia": 0.2,
    "Madagascar": 0.2,
    "Liechtenstein": 0.1,
    "Luxembourg": 0.1,
    "Cyprus": 0.1
};

// Fallback names for countries not in main database
const FALLBACK_NAMES = {
    firstNames: ["Alex", "David", "Michael", "James", "Robert", "John", "Daniel", "Chris", "Tom", "Paul"],
    lastNames: ["Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Garcia", "Martinez", "Rodriguez"]
};

// Function to get weighted random nationality
function getRandomNationality() {
    const rand = Math.random() * 100;
    let cumulative = 0;
    
    for (const [nationality, weight] of Object.entries(NATIONALITY_DISTRIBUTION)) {
        cumulative += weight;
        if (rand <= cumulative) {
            return nationality;
        }
    }
    
    return "Brazil"; // Fallback
}

// Function to get nationality based on scouting region
// 85% from region, 14% international mix, 1% complete wildcard
function getRegionBasedNationality(scoutRegion) {
    const rand = Math.random();

    // ~11% chance: complete wildcard from the full weighted distribution (global variety)
    if (rand < 0.11) {
        return getRandomNationality();
    }

    // ~68% chance: player from the club's own country
    if (rand < 0.79) {
        return getRegionPrimaryNationality(scoutRegion);
    }

    // ~21% chance: international player (nearby countries / diaspora)
    return getRegionSecondaryNationality(scoutRegion);
}

// Get primary nationality for a region
function getRegionPrimaryNationality(region) {
    const regionMap = {
        // Netherlands
        "Netherlands": "Netherlands",
        "North Holland": "Netherlands",
        "South Holland": "Netherlands",
        "Utrecht": "Netherlands",
        "Gelderland": "Netherlands",
        "North Brabant": "Netherlands",
        "Limburg": "Netherlands",
        "Friesland": "Netherlands",
        "Groningen": "Netherlands",
        "Drenthe": "Netherlands",
        "Overijssel": "Netherlands",
        "Zeeland": "Netherlands",
        "Flevoland": "Netherlands",
        
        // Germany
        "Germany": "Germany",
        "Bavaria": "Germany",
        "North Rhine-Westphalia": "Germany",
        "Baden-Württemberg": "Germany",
        "Lower Saxony": "Germany",
        "Hesse": "Germany",
        "Saxony": "Germany",
        "Rhineland-Palatinate": "Germany",
        "Berlin": "Germany",
        
        // Other countries
        "Switzerland": "Switzerland",
        "Belgium": "Belgium",
        "France": "France",
        "Spain": "Spain",
        "Italy": "Italy",
        "England": "England",
        "Portugal": "Portugal",
        "Brazil": "Brazil",
        "Argentina": "Argentina"
    };
    
    return regionMap[region] || "Netherlands";
}

// Get secondary (immigrant/neighbor) nationality for a region
function getRegionSecondaryNationality(region) {
    const secondaryMap = {
        // Netherlands: Common immigrant populations + neighbors
        "Netherlands": ["Germany", "Belgium", "Morocco", "Turkey", "Suriname", "Indonesia", "Poland"],
        "North Holland": ["Germany", "Belgium", "Morocco", "Turkey", "Suriname"],
        "South Holland": ["Morocco", "Turkey", "Suriname", "Indonesia", "Cape Verde"],
        "Utrecht": ["Germany", "Morocco", "Turkey", "Suriname"],
        "Gelderland": ["Germany", "Turkey", "Poland"],
        "North Brabant": ["Belgium", "Germany", "Turkey", "Morocco"],
        "Limburg": ["Belgium", "Germany", "Turkey"],
        "Friesland": ["Germany", "Poland"],
        "Groningen": ["Germany", "Poland"],
        
        // Germany: Neighbors + immigrants
        "Germany": ["Poland", "Turkey", "Italy", "Croatia", "Serbia", "Greece", "Netherlands"],
        "Bavaria": ["Austria", "Czech Republic", "Italy", "Croatia", "Turkey"],
        "North Rhine-Westphalia": ["Netherlands", "Belgium", "Turkey", "Poland", "Italy"],
        "Baden-Württemberg": ["Switzerland", "France", "Italy", "Turkey", "Croatia"],
        
        // Switzerland: Mix of all 4 language regions
        "Switzerland": ["Germany", "France", "Italy", "Portugal", "Spain", "Serbia", "Kosovo", "Turkey"],
        
        // Belgium: FR/NL mix + immigrants
        "Belgium": ["Netherlands", "France", "Morocco", "Turkey", "Italy", "Poland"],
        
        // Others
        "France": ["Algeria", "Morocco", "Tunisia", "Senegal", "Cameroon", "Portugal", "Italy"],
        "Spain": ["Morocco", "Ecuador", "Colombia", "Argentina", "Brazil"],
        "Italy": ["Albania", "Romania", "Morocco", "Senegal", "Brazil"],
        "England": ["Ireland", "Jamaica", "Nigeria", "Ghana", "Pakistan", "India", "Poland"],
        "Portugal": ["Brazil", "Cape Verde", "Angola", "Guinea-Bissau"],
        "Brazil": ["Italy", "Germany", "Japan", "Portugal", "Spain"],
        "Argentina": ["Italy", "Spain", "Paraguay", "Bolivia"]
    };
    
    const options = secondaryMap[region] || ["Germany", "France", "Spain", "Italy", "Brazil"];
    
    // Pick random from secondary options
    return options[Math.floor(Math.random() * options.length)];
}

// Function to generate a name based on nationality
function generateName(nationality) {
    const names = NAMES_DATABASE[nationality] || FALLBACK_NAMES;
    const firstName = names.firstNames[Math.floor(Math.random() * names.firstNames.length)];
    const lastName = names.lastNames[Math.floor(Math.random() * names.lastNames.length)];
    
    return `${firstName} ${lastName}`;
}

// Function to get flag emoji for nationality
function getNationalityFlag(nationality) {
    const flags = {
        "Switzerland": "🇨🇭",
        "Brazil": "🇧🇷",
        "Germany": "🇩🇪",
        "France": "🇫🇷",
        "England": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
        "Spain": "🇪🇸",
        "Italy": "🇮🇹",
        "Netherlands": "🇳🇱",
        "Portugal": "🇵🇹",
        "Belgium": "🇧🇪",
        "Argentina": "🇦🇷",
        "Croatia": "🇭🇷",
        "Uruguay": "🇺🇾",
        "Colombia": "🇨🇴",
        "Denmark": "🇩🇰",
        "Sweden": "🇸🇪",
        "Austria": "🇦🇹",
        "Poland": "🇵🇱",
        "Czech Republic": "🇨🇿",
        "Turkey": "🇹🇷",
        "Scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
        "Serbia": "🇷🇸",
        "Norway": "🇳🇴",
        "Russia": "🇷🇺",
        "Ukraine": "🇺🇦",
        "Greece": "🇬🇷",
        "Slovakia": "🇸🇰",
        "Romania": "🇷🇴",
        "Hungary": "🇭🇺",
        "Finland": "🇫🇮",
        "Wales": "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
        "Ireland": "🇮🇪",
        "Ghana": "🇬🇭",
        "Senegal": "🇸🇳",
        "Nigeria": "🇳🇬",
        "Cameroon": "🇨🇲",
        "Egypt": "🇪🇬",
        "Japan": "🇯🇵",
        "South Korea": "🇰🇷",
        "Australia": "🇦🇺",
        "USA": "🇺🇸",
        "Mexico": "🇲🇽",
        "Chile": "🇨🇱",
        "Peru": "🇵🇪",
        "Ecuador": "🇪🇨",
        "Morocco": "🇲🇦", "Turkey": "🇹🇷", "Suriname": "🇸🇷", "Indonesia": "🇮🇩",
        "Cape Verde": "🇨🇻", "Kosovo": "🇽🇰", "Albania": "🇦🇱", "Algeria": "🇩🇿",
        "Tunisia": "🇹🇳", "Angola": "🇦🇴", "Guinea-Bissau": "🇬🇼", "Jamaica": "🇯🇲",
        "Pakistan": "🇵🇰", "India": "🇮🇳", "Paraguay": "🇵🇾", "Bolivia": "🇧🇴",
        "Iran": "🇮🇷", "Iraq": "🇮🇶", "Bosnia": "🇧🇦", "Bulgaria": "🇧🇬",
        "Georgia": "🇬🇪", "Armenia": "🇦🇲", "Iceland": "🇮🇸", "DRC": "🇨🇩",
        "Gabon": "🇬🇦", "Gambia": "🇬🇲", "Kenya": "🇰🇪", "China": "🇨🇳",
        "Canada": "🇨🇦", "Cyprus": "🇨🇾"
    };

    return flags[nationality] || "🌍";
}
