# irma
Welcome to [Digital organisms](https://en.wikipedia.org/wiki/Digital_organism) ecology system experiment. This is optimized 2D ecosystem with ability to run up to 100 000 agents (organisms) in parallel. It uses linear assembler like language [(LGP)](https://en.wikipedia.org/wiki/Linear_genetic_programming) as a DNA, which runs under self maded simple VM. The purpose is in producing complex behavior of such organisms. Main ideas obtained from [Synthesis theory](https://en.wikipedia.org/wiki/Modern_synthesis_(20th_century)) and [Self-replicating machines](https://en.wikipedia.org/wiki/Self-replicating_machine). Real time configurable. Uses pure JS. Enjoy our research!

![irma](https://github.com/tmptrash/irma/raw/dots-as-commands/images/irma.png)
#### Documentation
- [Detailed description (rus)](https://docs.google.com/document/d/1qTz61YHFw17TLQeiHPI_xKHCWmP0st1fFukv4d9k460)

#### Steps to run:
1. git clone https://github.com/tmptrash/irma
2. cd irma
3. npm i
4. npm run build
5. cd dist
6. run index.html in Chrome

#### Steps to run tests:
1. cd irma
2. npm test
3. npm run cover (run tests with coverage)

#### Available commands:
1. npm test      - runs tests in production mode (without browser)
2. npm run dtest - runs tests in development mode (in Chrome)
3. npm run cover - runs tests with coverage (istanbul)
4. npm run prod  - build irma in production mode
4. npm run dev   - build irma in development mode

# Old research
#### Presentations
- [jevo 2016 (rus)](https://www.youtube.com/watch?v=tF77s_4RA08) - this presentation is about first attempts of obtaining complex behavior of organisms. Julia language was used for that. All details are presented in presentation.
- [construct 2017 (rus)](https://www.youtube.com/watch?v=9ykr9KzcKq) - this is next attempt to create complex behavior using distributed network of chrome browsers (NodeJs + browsers).

#### Videos
- [construct (rus)](https://www.youtube.com/watch?v=cfgcEVQ5A-A) - Introduction to Genetic Algorithm and construct project
- [construct (rus)](https://www.youtube.com/watch?v=28hzh-BUzbQ) - Example of Evolution of types