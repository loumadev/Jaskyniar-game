Vytvor hru, v ktorej budeš ako jaskyniar hľadať cestu von z jaskyne. Postupne spracuj tieto časti hry:
1. **[5]** ✅ Hra načíta mapu jaskyne zo súboru, v mape sa nachádzajú rôzne objekty, ako steny, šípy, príšery, štart a východ z jaskyne, presnejšie:
    * znak “#” (mriežka) označuje stenu jaskyne,
    * znak “ ” (medzera) označuje prázdnu podlahu, po ktorej sa dá chodiť,
    * znak “S” označuje začiatočnú polohu jaskyniara (v súbore sa musí nachádzať práve raz),
    * znak “X” označuje východ z jaskyne (v súbore sa môže nachádzať aj viackrát),
    * znak “P” označuje príšeru v jaskyni, ktorá stráži dané políčko, nehýbe sa, môže ich byť v jaskyni viacero,
    * znak “A” označuje šíp do luku, ktorý si môže jaskyniar vziať, každý šíp sa dá zodvihnúť iba raz, po zdvihnutí šípu sa jeho políčko správa ako prázdna podlaha.
    * Zopár detailov:
		* o Súbor popisuje jaskyňu ako pravouhlú mriežku, jaskyniar sa v nej vie hýbať iba hore, dolu, vpravo a vľavo.
		* o Ak jaskyniar dosiahne políčko označené ako X, vyhráva a opúšťa jaskyňu.
		* o Ak jaskyniar vstúpi na políčko označené ako P je zožratý príšerou a prehráva (hra končí).
		* o Ako sa zdvíha šíp zo zeme je na tvojom rozhodnutí, môže sa zdvihnúť stlačením klávesu ak hráč stojí na mieste šípu alebo tak, že na políčko so šípom vstúpi, alebo inak.

2. **[10]** ✅ Jaskyniar vidí iba výsek 9x9 políčok z jaskyne (jaskyniar je v strede, tj. vidí políčko na ktorom stojí, celu časť mapy o štyri políčka vyššie, o štyri políčka nižšie, o štyri políčka vpravo a o štyri políčka vľavo), môže sa hýbať stláčaním kláves so šípkami (alebo kláves W, A, S, D) - na obrazovke sa teda nehýbe jaskyniar ale jaskyňa okolo jaskyniara.

3. **[15]** ✅ Jaskyniar môže nájsť šípy do luku a s nimi môže zastreliť príšeru lukom, po vystrelení šípu sa šíp odčíta, streľba funguje tak, že podržíme medzerník a smerovou šípkou (alebo niektorou z kláves W, A, S, D) namierime smerom, ktorým chceme strieľať.

4. **[5]** ✅ Jaskyniar vidí vždy všetky steny v zobrazovanom výseku jaskyne, príšery, šípy a východ vidí len na vzdialenosť 3 políčok od seba (aj cez steny).

5. **[15]** ✅ Hra vypíše koľko šípov a príšer je dostupných, hra tiež zobrazí navigáciu k šípom, k príšere a k východu s možnosťou výberu cez tlačidlá 1, 2, 3. Navigácia bude ukazovať iba smer kam mam ísť najbližšie. V prípade ak mapa neobsahuje zvolený cieľ, alebo je zvolený cieľ nedosiahnuteľný (napr. k východu sa nedá dostať cez príšeru), program vypíše, že cieľ je nedosiahnuteľný.

6. **[25] BONUS**: ✅ Jaskyniar steny vidí stále, ale príšery, šípy a východ vidí len na vzdialenosť 2 políčok od seba a to iba ak ich má priamo v zornom poli (steny vrhajú tieň, v ktorom jaskyniar nič nevidí).

7. **[50] BONUS**: ✅ Jaskyniar musí vedieť vyriešiť sám celú jaskyňu (bez ovládania z klávesnice alebo inak), pohyb jaskyniara a jeho akcie bude ovládať AI (umelá inteligencia), AI musí vedieť vyriešiť mapu, ak má riešenie (teda existuje taká postupnosť krokov, ktorá dovedie jaskyniara do východu z jaskyne) alebo vypíše, že riešenie pre jaskyňu neexistuje. AI musí vedieť zohľadniť nasledujúce stavy:
    * na mape môže byť 0 a viac šípov,
    * na mape môže byť 0 a viac príšer,
    * na mape môže byť 0 a viac východov,
    * východ môže byt dostupný až za jednou alebo viacerými príšerami,
    * v mape nemusí byť dosť dosiahnuteľných šípov na zastrelenie všetkých príšer,
    * k východu sa dá dostať aj bez zastrelenia príšer.