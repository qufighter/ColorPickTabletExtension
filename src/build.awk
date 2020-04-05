#!/bin/awk
# This script extracts the version number from manifest.json
# author  < http://vidsbee.com >

BEGIN{
  FS=":"
}

{
  split($1,k,"\"")
  if( k[2]=="version"){
   split($2,v,"\"")
   print v[2]
  }
}

END{ }
