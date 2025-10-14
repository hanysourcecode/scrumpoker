docker stop scrum-poker
docker rm scrum-poker
docker run -p 5000:5000 --name scrum-poker scrum-poker