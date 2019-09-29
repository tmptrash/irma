# irma (*beta)
Welcome to [Digital organisms](https://en.wikipedia.org/wiki/Digital_organism) ecology system. This is optimized 2D ecosystem with ability to run up to 10 000 agents (organisms) and 100 000 molecules (matter and organism's food) in parallel. It uses linear assembler-like language [(LGP)](https://en.wikipedia.org/wiki/Linear_genetic_programming) as a DNA, which runs under self maded VM. The purpose is in producing **complex behavior** of organisms based on generated code. Such code is used as organism's brain and manages all his life aspects. Also, this system uses evolution to change (mutate) and select (natural selection) best agents from population. This is how mentioned complex behavior should appear. Through generations, every new organism should, in theory, be more adopted to virtual environment and more complex (but not always). Instead of neural networks, organisms use special byte code (mentioned "brain"). Mutations affect this code to produce small variety in population. Best organisms will have more chance to produce more children. Main ideas obtained from [Synthesis theory](https://en.wikipedia.org/wiki/Modern_synthesis_(20th_century)) and [Self-replicating machines](https://en.wikipedia.org/wiki/Self-replicating_machine). 2D world consist of organisms and atoms - code instructions, which are basis and food for constucting organisms bodies. Enjoy our research!

![irma](https://github.com/tmptrash/irma/raw/dots-as-commands/images/irma.png)

The image above represents common irma 2D world with organisms (red dots), rocks (yellow dots) and energy (blue dots). To see this world in motion click [here](https://www.youtube.com/watch?v=28hzh-BUzbQ).
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
