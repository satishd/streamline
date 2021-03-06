/**
  * Copyright 2017 Hortonworks.
  *
  * Licensed under the Apache License, Version 2.0 (the "License");
  * you may not use this file except in compliance with the License.
  * You may obtain a copy of the License at
  *   http://www.apache.org/licenses/LICENSE-2.0
  * Unless required by applicable law or agreed to in writing, software
  * distributed under the License is distributed on an "AS IS" BASIS,
  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  * See the License for the specific language governing permissions and
  * limitations under the License.
**/

import React from 'react';
import _ from 'lodash';
import moment from 'moment';
import * as Fields from '../libs/form/Fields';

const sortArray = function(sortingArr, keyName, ascendingFlag) {
  if (ascendingFlag) {
    return sortingArr.sort(function(a, b) {
      if (a[keyName] < b[keyName]){
        return -1;
      }
      if (a[keyName] > b[keyName]){
        return 1;
      }
      return 0;
    });
  } else {
    return sortingArr.sort(function(a, b) {
      if (b[keyName] < a[keyName]){
        return -1;
      }
      if (b[keyName] > a[keyName]){
        return 1;
      }
      return 0;
    });
  }
};

const numberToMilliseconds = function(number, type) {
  if (type === 'Seconds') {
    return number * 1000;
  } else if (type === 'Minutes') {
    return number * 60000;
  } else if (type === 'Hours') {
    return number * 3600000;
  }
};

const millisecondsToNumber = function(number) {
  let hours = (number / (1000 * 60 * 60)) % 24;
  let minutes = (number / (1000 * 60)) % 60;
  let seconds = (number / (1000)) % 60;
  if (hours % 1 === 0) {
    return {
      number: (number / (1000 * 60 * 60)),
      type: 'Hours'
    };
  } else if (minutes % 1 === 0) {
    return {
      number: (number / (1000 * 60)),
      type: 'Minutes'
    };
  } else if (seconds % 1 === 0) {
    return {
      number: (number / (1000)),
      type: 'Seconds'
    };
  } else {
    console.error("Something went wrong in converting millseconds to proper format");
  }
};

const capitaliseFirstLetter = function(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

const splitTimeStamp = function(date) {
  const currentDT = moment(new Date());
  const createdDT = moment(date);
  const dateObj = moment.duration(currentDT.diff(createdDT));
  return ((dateObj._data.days === 0)
    ? ''
    : dateObj._data.days + 'd ') + ((dateObj._data.days === 0 && dateObj._data.hours === 0)
    ? ''
    : dateObj._data.hours + 'h ') + ((dateObj._data.days === 0 && dateObj._data.hours === 0 && dateObj._data.minutes === 0)
    ? ''
    : dateObj._data.minutes + 'm ') + dateObj._data.seconds + 's ago';
};

const splitSeconds = function(sec_num) {
  let days = Math.floor(sec_num / (3600 * 24));
  let hours = Math.floor((sec_num - (days * (3600 * 24))) / 3600);
  let minutes = Math.floor((sec_num - (days * (3600 * 24)) - (hours * 3600)) / 60);
  let seconds = Math.floor(sec_num - (days * (3600 * 24)) - (hours * 3600) - (minutes * 60));

  if (hours < 10) {
    hours = "0" + hours;
  }
  if (minutes < 10) {
    minutes = "0" + minutes;
  }
  if (seconds < 10) {
    seconds = "0" + seconds;
  }

  return ((days === 0)
    ? ''
    : days + 'd ') + ((days === 0 && (hours == "00" || 0))
    ? ''
    : hours + 'h ') + ((days === 0 && (hours == "00" || 0) && minutes === 0)
    ? ''
    : minutes + 'm ') + seconds + 's ago';
};

const filterByName = function(entities, filterValue) {
  let matchFilter = new RegExp(filterValue, 'i');
  return entities.filter(filteredList => !filterValue || matchFilter.test(filteredList.name));
};

const ellipses = function(string, len) {
  if (!string) {
    return;
  }
  const str = string.substr(0, len || 10); // default 10 character...
  return (string.length > len)
    ? `${str}...`
    : str;
};

const sortByKey = function(string) {
  switch (string) {
  case "last_updated":
    return "Last Updated";
    break;
  case "name":
    return "Name";
    break;
  case "status":
    return "Status";
    break;
  default:
    return "Last Updated";
  }
};

const secToMinConverter = function(milliseconds, src) {
  milliseconds = (!milliseconds)
    ? 0
    : milliseconds;
  let hours = milliseconds / (1000 * 60 * 60);
  let absoluteHours = Math.floor(hours);
  let f_hours = absoluteHours > 9
    ? absoluteHours
    : 0 + absoluteHours;

  //Get remainder from hours and convert to minutes
  let minutes = (hours - absoluteHours) * 60;
  let absoluteMinutes = Math.floor(minutes);
  let f_mins = absoluteMinutes > 9
    ? absoluteMinutes
    : 0 + absoluteMinutes;

  //Get remainder from minutes and convert to seconds
  let seconds = (minutes - absoluteMinutes) * 60;
  let absoluteSeconds = Math.floor(seconds);
  let f_secs = absoluteSeconds > 9
    ? absoluteSeconds
    : 0 + absoluteSeconds;

  (f_hours !== 0)
    ? milliseconds = (src === "list")
      ? _.round(f_hours + "." + f_mins) + " hours"
      : _.round(f_hours + "." + f_mins) + "/hours"
    : (f_mins !== 0 && f_secs !== 0)
      ? milliseconds = (src === "list")
        ? _.round(f_mins + "." + f_secs) + " mins"
        : _.round(f_mins + "." + f_secs) + "/mins"
      : milliseconds = (src === "list")
        ? _.round(f_secs) + " sec"
        : _.round(f_secs) + "/sec";
  return milliseconds;
};

const kFormatter = function(num) {
  num = (!num)
    ? 0
    : num;
  return num > 999
    ? (num / 1000).toFixed(1) + 'k'
    : num;
};

const eventTimeData = function(inputFields) {
  const eventTimeArr = inputFields.filter((k, i) => {
    return k.type.toLowerCase() === "long";
  }).map((v) => {
    return {fieldName: v.name, uiName: v.name};
  });
  eventTimeArr.push({fieldName: "processingTime", uiName: "processingTime"});
  return eventTimeArr;
};

const inputFieldsData = function(inputFields) {
  const inputFieldsArr = inputFields.map(v => {
    return {fieldName: v.name, uiName: v.name, fieldType: v.type};
  });
  return inputFieldsArr;
};

const checkNestedInputFields = function(inputObj, fieldsData) {
  // if the inputObj doesn't have options and hint the inputObj return it self
  if (!inputObj.options && inputObj.hint === undefined) {
    return inputObj;
  }
  const populateFields = (obj) => {
    if (obj.options && obj.hint === undefined) {
      obj.options.map((x) => {
        if (x.fields) {
          x.fields.map((k) => {
            populateFields(k);
          });
        }
      });
      return obj;
    } else {
      //InputObj which have options and hint of "inputfields" OR "eventtime" OR "override"
      //those fields are mapped by inputFieldsData function
      if (obj.options && obj.hint !== undefined) {
        if (obj.hint.toLowerCase().indexOf("inputfields") !== -1 && !obj.options.length) {
          obj.options = inputFieldsData(fieldsData);
        } else if (obj.hint.toLowerCase().indexOf("eventtime") !== -1 && (obj.options.length === 0 || obj.options[0].uiName === "processingTime")) {
          obj.options = eventTimeData(fieldsData);
        } else if (obj.hint.toLowerCase().indexOf("override") !== -1 && obj.type === "enumstring") {
          obj.type = "creatableField";
        }
      };
      return obj;
    }
  };
  return populateFields(JSON.parse(JSON.stringify(inputObj)));
};

const genFields = function(fieldsJSON, _fieldName = [], FormData = {}, inputFields = []) {
  const fields = [];
  fieldsJSON.forEach((d, i) => {
    d = checkNestedInputFields(d, inputFields);
    const Comp = Fields[d.type.split('.').join('')] || null;
    let _name = [
      ..._fieldName,
      d.fieldName
    ];
    if (Comp) {
      let children = null;
      if (d.fields && d.type != 'array.object' && d.type != 'array.enumobject') {
        const _FormData = FormData[d.fieldName] = FormData[d.fieldName]
          ? FormData[d.fieldName]
          : {};
        children = genFields(d.fields, _name, _FormData);
      }
      if (d.defaultValue != null) {
        if (d.type == 'enumobject') {
          FormData[d.fieldName] = FormData[d.fieldName] || {
            [d.defaultValue]: {}
          };
        } else {
          FormData[d.fieldName] = FormData[d.fieldName] != undefined
            ? FormData[d.fieldName]
            : d.defaultValue;
        }
      }
      const options = [];
      if (d.options) {
        d.options.forEach((d) => {
          if (!_.isObject(d)) {
            options.push({value: d, label: d});
          } else {
            options.push({value: d.fieldName, label: d.uiName, type: d.fieldType});
          }
        });
      }
      let validators = [];
      if (!d.isOptional) {
        validators.push('required');
      }
      if (d.hint !== undefined && d.hint.toLowerCase().indexOf("email") !== -1) {
        validators.push('email');
      }
      fields.push(
        <Comp label={d.uiName} _ref={d.fieldName} value={d.fieldName/*_name.join('.')*/} valuePath={_name.join('.')} key={_name.join('.')} validation={validators} fieldAttr={{
          options: options
        }} fieldJson={d}>{children}</Comp>
      );
    }
  });
  return fields;
};

const scrollMe = function(element, to, duration) {
  if (duration <= 0) {
    return;
  }
  let difference = to - element.scrollTop;
  let perTick = difference / duration * 10;

  const timer = setTimeout(function() {
    element.scrollTop = element.scrollTop + perTick;
    if (element.scrollTop == to) {
      clearTimeout(timer);
      return;
    }
    scrollMe(element, to, duration - 10);
  }, 10);
};

const validateURL = function(url) {
  let URL = url.toLowerCase(),
    result = false;
  const matchStr = "/api/v1/clusters/";
  if (URL.indexOf(matchStr) !== -1) {
    let str = URL.substr((URL.indexOf(matchStr) + matchStr.length), URL.length);
    if (/^[a-zA-Z0-9_.-]*$/.test(str)) {
      return result = true;
    }
  }
  return result;
};

const convertMillsecondsToSecond = function(milliSec) {
  return Math.round(milliSec / 1000);
};

const validateJSON = function(json){
  let validFlag = true;
  try{
    const data = JSON.parse(json);
  }catch(err){
    validFlag = false;
  }
  return validFlag;
};

const isMergeableObject = function (val) {
  let nonNullObject = val && typeof val === 'object';

  return nonNullObject
    && Object.prototype.toString.call(val) !== '[object RegExp]'
    && Object.prototype.toString.call(val) !== '[object Date]';
};

const emptyTarget = function (val) {
  return Array.isArray(val) ? [] : {};
};

const cloneIfNecessary = function (value, optionsArgument) {
  let clone = optionsArgument && optionsArgument.clone === true;
  return (clone && isMergeableObject(value)) ? deepmerge(emptyTarget(value), value, optionsArgument) : value;
};

const defaultArrayMerge = function (target, source, optionsArgument) {
  let destination = target.slice();
  source.forEach(function(e, i) {
    if (typeof destination[i] === 'undefined') {
      destination[i] = cloneIfNecessary(e, optionsArgument);
    } else if (isMergeableObject(e)) {
      destination[i] = deepmerge(target[i], e, optionsArgument);
    } else if (target.indexOf(e) === -1) {
      destination.push(cloneIfNecessary(e, optionsArgument));
    }
  });
  return destination;
};

const mergeObject = function (target, source, optionsArgument) {
  let destination = {};
  if (isMergeableObject(target)) {
    Object.keys(target).forEach(function (key) {
      destination[key] = cloneIfNecessary(target[key], optionsArgument);
    });
  }
  Object.keys(source).forEach(function (key) {
    if (!isMergeableObject(source[key]) || !target[key]) {
      destination[key] = cloneIfNecessary(source[key], optionsArgument);
    } else {
      destination[key] = deepmerge(target[key], source[key], optionsArgument);
    }
  });
  return destination;
};

const deepmerge = function (target, source, optionsArgument) {
  let array = Array.isArray(source);
  let options = optionsArgument || { arrayMerge: defaultArrayMerge };
  let arrayMerge = options.arrayMerge || defaultArrayMerge;

  if (array) {
    return Array.isArray(target) ? arrayMerge(target, source, optionsArgument) : cloneIfNecessary(source, optionsArgument);
  } else {
    return mergeObject(target, source, optionsArgument);
  }
};

const deepmergeAll = function deepmergeAll(array, optionsArgument) {
  if (!Array.isArray(array) || array.length < 2) {
    throw new Error('first argument should be an array with at least two elements');
  }

  // we are sure there are at least 2 values, so it is safe to have no initial value
  return array.reduce(function(prev, next) {
    return deepmerge(prev, next, optionsArgument);
  });
};

const mergeFormDataFields = function(name, clusterArr,clusterName,formData,uiSpecification){
  let data = {},
    obj = [];
  let config = uiSpecification;
  _.keys(clusterArr).map((x) => {
    if (name || clusterName === x) {
      const nestedFields = function(configList){
        obj = configList.map((list) => {
          if(list.fields){
            nestedFields(list.fields);
          }
          _.keys(clusterArr[x].hints).map(k => {
            const nestedKeys = function(pk){
              if (pk.indexOf('.') !== -1) {
                let mk = pk.split('.');
                mk.length > 1 ? mk.splice(0, 1) : '' ;
                nestedKeys(mk.join('.'));
              } else if (list.fieldName === pk) {
                if (_.isArray(clusterArr[x].hints[k]) && (name || clusterName) === x) {
                  list.options = clusterArr[x].hints[k].map(v => {
                    return {fieldName: v, uiName: v};
                  });
                  if (list.hint && list.hint.toLowerCase().indexOf("override") !== -1) {
                    if (formData[k]) {
                      if (list.options.findIndex((o) => {
                        return o.fieldName == formData[k];
                      }) == -1) {
                        list.options.push({fieldName: formData[k], uiName: formData[k]});
                      }
                    }
                  }
                } else {
                  if (!_.isArray(clusterArr[x].hints[k])) {
                    // if (!formData[k]) this means it has come first time
                    // OR
                    // if (!name) this means user had change the cluster name
                    if (!formData[k] || !name) {
                      _.set(data,k,_.get(formData,k,clusterArr[x].hints[k]));
                    }
                  }
                }
              }
            };
            nestedKeys(k);
          });
          data.clusters = clusterArr[name || clusterName].cluster.name;
          return list;
        });
      };
      nestedFields(config);
    }
  });
  const tempData = this.deepmerge(formData,data);
  return {obj,tempData};
};

const handleNestedFormDataEmptyObj = (formData) => {
  const nestedObj = function(data){
    return _.map(_.keys(data), (key) => {
      if(_.isObject(data[key])){
        nestedObj(data[key]);
      } else if (_.isArray(data[key])){
        if(data[key].length === 0){
          delete data[key];
        }
      } else {
        if(data[key] === undefined || data[key] === ''){
          delete data[key];
        }
      }
    });
  };
  return nestedObj(formData);
};

const eventLogNumberId = function(num){
  if(!num){
    return;
  }
  let numString = num.toString();
  numString =  numString.length === 1 ? `00${numString}` : numString.length === 2 ? `0${numString}` : numString;
  return numString;
};

export default {
  sortArray,
  numberToMilliseconds,
  millisecondsToNumber,
  capitaliseFirstLetter,
  splitTimeStamp,
  splitSeconds,
  filterByName,
  ellipses,
  sortByKey,
  secToMinConverter,
  genFields,
  kFormatter,
  scrollMe,
  validateURL,
  convertMillsecondsToSecond,
  validateJSON,
  isMergeableObject,
  emptyTarget,
  cloneIfNecessary,
  defaultArrayMerge,
  mergeObject,
  deepmerge,
  deepmergeAll,
  mergeFormDataFields,
  handleNestedFormDataEmptyObj,
  eventLogNumberId
};
