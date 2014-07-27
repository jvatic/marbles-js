namespace :docs do
  task :generate do
    system "jsdoc marbles.js --destination docs"
  end
end
