/*
  Initially 10 particles that repel each other.
  Clicking the mouse will apply an attraction force to each particle at mouse location.
  Both the particle repulsion and mouse attraction can be reversed by pressing space.
  Particle count can be increased/decreased with up and down arrows respectively.
  Particles will wrap around to other edge if leaving canvas.
*/

let particles = [];

const G = 100;

let repel = 1;

function setup() {
  // create canvas the width and height of the window being drawn to
  createCanvas(window.innerWidth, window.innerHeight);

  // create initial 10 particles
  for (let i = 0; i < 10; i++) {
    particles.push(new Particle(random(width), random(height), 2, 20));
  }
  
}

function draw() {
  // each frame, redrawn background
  background(51);

  // if mouse is pressed, attract/repel all particles towards mouse position
  if (mouseIsPressed) {
    particles.forEach(particle => {
      // to interface with particle.calcGravForce, need an object with .pos and .mass variable

      let mouseObj = {
        pos: createVector(mouseX, mouseY),
        mass: 10
      };

      let force = particle.calcGravForce(mouseObj);
      particle.applyForce(force.mult(repel));
    })
  }
  
  // iterate through each particle i and calculate repulsion/attraction force to particle j
  // starting j as i + 1 ensures never calculating force between a particle and itself
  // calculating the force and applying the negative force to the paired particle
  // reduces the amount of force calculations done in half 
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      let force = particles[i].calcGravForce(particles[j]);

      // as force is initially repelling, the force applied to particle i is multiplied by -repel
      // and multiplied by repel for particle j
      particles[i].applyForce(force.copy().mult(-repel));
      particles[j].applyForce(force.copy().mult(repel));
    }
  }

  particles.forEach(particle => {
    particle.update();
  })

  particles.forEach(particle => {
    particle.draw();
  })
}

function keyPressed() {
  // create new particle on up arrow press
  if (keyCode === UP_ARROW) {
    particles.push(new Particle(random(0, width), random(0, height), 2, 20));
  }

  // remove oldest particle on down arrow press
  if (keyCode === DOWN_ARROW) {
    particles.shift();
  }

  // switch repulsion/attraction if space is pressed
  if (keyCode === 32) {
    repel = -repel;
  }
}

function Particle(x, y, mass, diameter) {
  this.pos = createVector(x, y);
  this.vel = createVector(0, 0);
  this.acc = createVector(0, 0);
  this.diameter = diameter;
  this.mass = mass;
  this.trail = [];
  this.colours = [255, 255, 255];

  // create the trail for each particle
  for (let i = 10; i > 0; i--) {
    this.trail.push(new TrailParticle(this.pos, this.diameter * (i / 11), color(...this.colours)));
  }

  // add force vector to acceleration
  this.applyForce = function(force) {
    this.acc.add(force.div(this.mass));
  }

  // calculate force between two objects based on their distance from each other and masses
  this.calcGravForce = function(obj) {
    let force = p5.Vector.sub(obj.pos, this.pos);
    let distance = constrain(force.mag(), 40, 2000);
    
    force.setMag((G * this.mass * obj.mass) / (distance ** 2));
    return force;
  }

  this.update = function() {
    // starting from the end, give each trail particle the position and colour of the next trail particle
    // this causes each trail particle to "lag" behind the next trail particle by 1 frame
    for (let i = this.trail.length - 1; i > 0; i--) {
      this.trail[i].pos = this.trail[i - 1].pos.copy();
      this.trail[i].colour = this.trail[i - 1].colour;
    }
    
    // give the first trail particle the position/colour of the particle before updating the particle position
    this.trail[0].pos = this.pos.copy();
    this.trail[0].colour = color(...this.colours);

    // add acceleration to velocity and velocity to position
    this.vel.add(this.acc);
    this.pos.add(this.vel);

    // set acceleration to zero to reset for next frame
    this.acc.set(0, 0);

    this.normalisePosition();

    // adjust colour dependent upon velocity, to appear more red the faster the particle is moving
    let vMag = this.vel.mag();

    if (vMag > 1) {
      vMag = map(vMag, 1, 15, 0, 255)
      this.colours[1] = 255 - vMag;
      this.colours[2] = 255 - vMag;
    } else {
      this.colours[1] = 255;
      this.colours[2] = 255;
    }
  }

  this.draw = function() {
    // draw trail particles first, starting from the end so the closest trail particles overlap the further ones
    for (let i = this.trail.length - 1; i >= 0; i--) {
      this.trail[i].draw();
    }
    strokeWeight(0);
    fill(color(...this.colours));
    circle(this.pos.x, this.pos.y, this.diameter);
  }

  this.normalisePosition = function() {
    // if particle leaves edges of the canvas, wrap around the position to the opposite side
    // leaves velocity as it was
    if (this.pos.y > height + this.diameter / 2) {
      this.pos.y = 0;
    }

    if (this.pos.y < 0 - this.diameter / 2) {
      this.pos.y = height;
    }

    if (this.pos.x > width + this.diameter / 2) {
      this.pos.x = 0;
    }

    if (this.pos.x < 0 - this.diameter / 2) {
      this.pos.x = width;
    }
  }
}

function TrailParticle(position, diameter, colour) {
  this.pos = position;
  this.diameter = diameter;
  this.colour = colour;

  this.draw = function() {
    strokeWeight(0);
    fill(this.colour);
    circle(this.pos.x, this.pos.y, this.diameter);
  }
}