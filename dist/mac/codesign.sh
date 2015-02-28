#!/bin/sh

case ${OSTYPE} in *darwin*)
    # if this fails please run `brew install coreutils` - homebrew also has this package
    alias readlink=greadlink
    ;;
esac

dir="$(dirname $(readlink -f ${0}))"
build="${dir}/../../build/releases/Guimovie/mac"
app="${build}/Guimovie.app"
identity="2Z88DW977Y"

if [ -z "$1" ]; then
  echo "You need to provide the version."
  exit 1
fi

echo "### remove previous dmg"
rm -rf ${build}/*.dmg

echo "### signing frameworks"
codesign --force --verify --verbose --sign "${identity}" "${app}/Contents/Frameworks/node-webkit Framework.framework/node-webkit Framework"
codesign --force --verify --verbose --sign "${identity}" "${app}/Contents/Frameworks/node-webkit Helper EH.app/"
codesign --force --verify --verbose --sign "${identity}" "${app}/Contents/Frameworks/node-webkit Helper NP.app/"
codesign --force --verify --verbose --sign "${identity}" "${app}/Contents/Frameworks/node-webkit Helper.app/"
codesign --force --verify --verbose --sign "${identity}" "${app}/Contents/Frameworks/crash_inspector"

echo "### signing webkit"
codesign --force --verify --verbose --sign "${identity}" "${app}/Contents/MacOS/node-webkit"

echo "### signing app"
codesign --force --verify --verbose --sign "${identity}" "${app}"

echo "### verifying signature"
codesign -vvv -d "${app}"

echo "### create dmg"
dist/mac/yoursway-create-dmg/create-dmg --volname "Guimovie ${1}"  --window-size 480 540 --icon-size 128 --app-drop-link 240 370 --icon "Guimovie" 240 110 "${build}/Guimovie-${1}-Mac.dmg" "${build}"

dmg="${build}/Guimovie-${1}-Mac.dmg"

echo "### signing dmg"
codesign --force --verify --verbose --sign "${identity}" "${dmg}"

echo "### verifying signature"
codesign -vvv -d "${dmg}"
