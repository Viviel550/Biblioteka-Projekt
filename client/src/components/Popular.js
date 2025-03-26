import React from 'react';
import '../styles/Popular.css';

function Popular() {
    const books = [
        {
            title: "Wiedźmin - Miecz przeznaczenia",
            type: "Fantasy",
            description: `Wiedźmiński kodeks stawia tę sprawę w sposób jednoznaczny: wiedźminowi smoka zabijać się nie godzi.
            To gatunek zagrożony wymarciem. Aczkolwiek w powszechnej opinii to gad najbardziej wredny. Na oszluzgi, widłogony i latawce kodeks polować przyzwala.
            Ale na smoki – nie.
            
            Wiedźmin Geralt przyłącza się jednak do zorganizowanej przez króla Niedamira wyprawy na smoka, który skrył się w jaskiniach Gór Pustulskich. Na swej drodze spotyka trubadura Jaskra oraz – jakżeby inaczej – czarodziejkę Yennefer. Wśród zaproszonych przez króla co sławniejszych smokobójców jest Eyck z Denesle, rycerz bez skazy i zmazy, Rębacze z Cinfrid i szóstka krasnoludów pod komendą Yarpena Zigrina. Motywacje są różne, ale cel jeden.
            Smok nie ma szans.`,
            image: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fimage.ceneostatic.pl%2Fdata%2Fproducts%2F32692743%2Fi-wiedzmin-2-miecz-przeznaczenia.jpg&f=1&nofb=1&ipt=7ee0dce6038b26cda388612c26cbc7112d26a811f8211c5a68f55ed96742b435&ipo=images" // Replace with actual image URL
        },
        {
            title: "Harry Potter",
            type: "Fantasy",
            description: `Książki używane w stanie Zadowalający mogą posiadać niektóre z widocznych uszkodzeń, np. pęknięcia, zagięcia, postrzępienia, naderwania, ślady po taśmie, pieczątki, naklejki, inne.

Szósty tom przygód nastoletniego czarodzieja w nowej okładce autorstwa Jonny’ego Duddle’a.

Po nieudanej próbie przechwycenia przepowiedni Lord Voldemort jest gotów uczynić wszystko, by zawładnąć światem czarodziejów. Organizuje tajemny zamach na swego przeciwnika, a narzędziem w jego ręku staje się jeden z uczniów. Czy jego plan się powiedzie? Szósta część przygód Harry’ego Pottera przynosi cenne informacje o matce Voldemorta, jego dzieciństwie oraz początkach kariery młodego Toma Riddle’a, które rzucą nowe światło na sylwetkę głównego antagonisty Pottera.

Na czym polega sekret nadprzyrodzonej mocy Czarnego Pana? Jaki jest cel tajemniczych i niebezpiecznych wypraw Dumbledore’a? I wreszcie, kto jest tytułowym Księciem Półkrwi i jaką misję ma on do spełnienia?

Nowe wydanie książki o najsłynniejszym czarodzieju świata różni się od poprzednich nie tylko okładką, ale i wnętrzem – po raz pierwszy na początku każdego tomu pojawi się mapka Hogwartu i okolic, a początki rozdziałów ozdobione będą specjalnymi gwiazdkami.`,
            image: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fa.allegroimg.com%2Foriginal%2F11e570%2Ff94a4513421ca919be0a93721b1a%2FHARRY-POTTER-I-KSIAZE-POLKRWI-J-K-Rowling-KSIAZ&f=1&nofb=1&ipt=94d1e070cbe180688d937192d8a466fff905c9f176f1cf976fee892ab3089cd3&ipo=images" // Replace with actual image URL
        }
    ];

    return (
        <div className="popular">
            <h2>Popularne</h2>
            <ul>
                {books.map((book, index) => (
                    <li key={index} className="book-item">
                        <img src={book.image} alt={book.title} className="book-image" />
                        <div className="book-details">
                            <h3 className="book-title">{book.title}</h3>
                            <p className="book-type">{book.type}</p>
                            <p className="book-description">{book.description}</p>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default Popular;