sudo yum -y update

curl --silent --location https://rpm.nodesource.com/setup_6.x | bash -

yum -y install nodejs

sudo yum groupinstall 'Development Tools'

cd /vagrant/oracle-clients

sudo rpm -ivh oracle-instantclient11.2-basic-11.2.0.4.0-1.x86_64.rpm

sudo rpm -ivh oracle-instantclient11.2-devel-11.2.0.4.0-1.x86_64.rpm

cd ..

npm install
