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

import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import {Link} from 'react-router';
import _ from 'lodash';
import {DragDropContext} from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import TagREST from '../../rest/TagREST';
import Nestable from '../../libs/react-dnd-nestable/Nestable';
import TagsFormContainer from './TagsFormContainer';
import FSReactToastr from '../../components/FSReactToastr';
import Modal from '../../components/FSModal';
import BaseContainer from '../../containers/BaseContainer';
import Utils from '../../utils/Utils';
import {FormGroup, InputGroup, FormControl, Button} from 'react-bootstrap';
import CommonNotification from '../../utils/CommonNotification';
import {toastOpt} from '../../utils/Constants';
import NoData from '../../components/NoData';
import CommonLoaderSign from '../../components/CommonLoaderSign';

var styles = {
  children: {
    marginLeft: 30
  }
};

@DragDropContext(HTML5Backend)
export default class TagsContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      filterValue: '',
      fetchLoader: true
    };
    this.fetchData();
  }

  fetchData() {
    TagREST.getAllTags().then((tags) => {
      if (tags.responseMessage !== undefined) {
        FSReactToastr.error(
          <CommonNotification flag="error" content={tags.responseMessage}/>, '', toastOpt);
        this.setState({fetchLoader: false});
      } else {
        let data = this.tempData = tags.entities;
        this.syncData(data);
      }
    }).catch((err) => {
      FSReactToastr.error(
        <CommonNotification flag="error" content={err}/>, '', toastOpt);
    });
  }

  syncData(dataArr) {
    this.result = [];
    //Get metdata
    this.metaObj = this.getMetaData(dataArr);

    for (let i = 0; i < dataArr.length; i++) {
      if (!dataArr[i].children) {
        //Adding children array
        dataArr[i].children = [];
      }
      if (dataArr[i].tagIds.length === 0) {
        //Add only parent tags
        this.result.push(dataArr[i]);
      }
    }

    for (let i = 0; i < dataArr.length; i++) {
      if (dataArr[i].tagIds.length !== 0) {
        //Find parent and add all childrens into result array
        this.performAction(dataArr[i].id);
      }
    }
    this.setState({entities: this.result, fetchLoader: false});
  }

  getMetaData(dataArr) {
    let obj = {};
    for (let i = 0; i < dataArr.length; i++) {
      obj[dataArr[i].id] = dataArr[i].tagIds[0] || null;
    }
    return obj;
  }

  performAction(childId) {
    let flag = false;
    let childIdArr = [];
    childIdArr.push(childId);

    //Find all childId's and keep adding into childIdArr
    while (!flag) {
      if (this.metaObj[childId] !== null) {
        childIdArr.push(this.metaObj[childId]);
        childId = this.metaObj[childId];
      } else {
        flag = true;
      }
    }

    //Find parent Obj from result array
    let parentId = childIdArr.pop();
    let parentObj = _.find(this.result, function(o) {
      return o.id === parentId;
    });

    for (let i = childIdArr.length - 1; i >= 0; i--) {
      let id = childIdArr[i];
      let childObj = _.find(this.tempData, function(o) {
        return o.id === id;
      });
      if (!parentObj.children) {
        //add children array into parent object and push child object
        parentObj.children = [];
        parentObj.children.push(childObj);
        //making childObj as the parent Object for next element
        parentObj = childObj;
      } else {
        //find child object inside parent object
        let cObj = _.find(parentObj.children, function(o) {
          return o.id === id;
        });
        if (cObj) {
          //making childObj as the parent Object for next element
          parentObj = cObj;
        } else {
          parentObj.children.push(childObj);
          //making childObj as the parent Object for next element
          parentObj = childObj;
        }
      }
    }
  }

  state = {
    entities: [],
    modalTitle: '',
    parentId: null,
    currentId: null
  };

  handleAdd(id) {
    this.setState({
      modalTitle: 'Add New Tag',
      parentId: id,
      currentId: null
    }, () => {
      this.refs.Modal.show();
    });
  }

  handleSave() {
    if (this.refs.addTag.validateData()) {
      this.refs.addTag.handleSave().then(tag => {
        if (tag.responseMessage !== undefined) {
          FSReactToastr.error(
            <CommonNotification flag="error" content={tag.responseMessage}/>, '', toastOpt);
        } else {
          if (this.state.currentId) {
            FSReactToastr.success(
              <strong>Tag updated successfully</strong>
            );
          } else {
            FSReactToastr.success(
              <strong>Tag added successfully</strong>
            );
          }
        }
        this.refs.Modal.hide();
        this.fetchData();
      });
    }
  }

  handleEdit(id) {
    this.setState({
      modalTitle: 'Edit Tag',
      parentId: null,
      currentId: id
    }, () => {
      this.refs.Modal.show();
    });
  }

  handleDelete(id) {
    let BaseContainer = this.refs.BaseContainer;
    BaseContainer.refs.Confirm.show({title: 'Are you sure you want to delete ?'}).then((confirmBox) => {
      TagREST.deleteTag(id).then((tags) => {
        this.fetchData();
        confirmBox.cancel();
        if (tags.responseMessage !== undefined) {
          FSReactToastr.error(
            <CommonNotification flag="error" content={tags.responseMessage}/>, '', toastOpt);
        } else {
          FSReactToastr.success(
            <strong>Tag deleted successfully</strong>
          );
        }
      }).catch((err) => {
        FSReactToastr.error(
          <CommonNotification flag="error" content={err}/>, '', toastOpt);
      });
    }, (Modal) => {});
  }

  renderItem({item, connectDragSource}) {
    let self = this;
    return (
      <div>
        {connectDragSource(
          <div className="dd-handle dd3-handle"></div>
        )}
        <div className="dd3-content">
          <h5>{item.name}</h5>
          <p>{item.description}</p>
          <div className="btn-group btn-action">
            <button className="btn-success" onClick={self.handleAdd.bind(self, item.id)}>
              <i className="fa fa-plus"></i>
            </button>
            <button className="btn-warning" onClick={self.handleEdit.bind(self, item.id)}>
              <i className="fa fa-pencil"></i>
            </button>
            <button className="btn-danger" onClick={self.handleDelete.bind(self, item.id)}>
              <i className="fa fa-trash"></i>
            </button>
          </div>
        </div>
        <h5></h5>
      </div>
    );
  }

  updateItems(newItems, movedItem, positionArr) {
    let parentData = JSON.parse(JSON.stringify(newItems));
    let parentId = null;
    if (positionArr.length > 1) {
      for (let i = 0; i < positionArr.length - 1; i++) {
        parentData = parentData[positionArr[i]];
        if (i !== (positionArr.length - 2)) {
          parentData = parentData.children;
        }
      }
      parentId = [parentData.id];
    }

    let {id, name, description, tagIds} = movedItem;
    let data = {
      id,
      name,
      description,
      tagIds
    };
    data.tagIds = parentId;

    TagREST.putTag(movedItem.id, {body: JSON.stringify(data)}).then((tags) => {
      if (tags.responseMessage !== undefined) {
        FSReactToastr.error(
          <CommonNotification flag="error" content={tags.responseMessage}/>, '', toastOpt);
      } else {
        FSReactToastr.success(
          <strong>Tag position updated successfully</strong>
        );
      }
    }).catch((err) => {
      FSReactToastr.error(
        <CommonNotification flag="error" content={err}/>, '', toastOpt);
    });
    this.setState({entities: newItems});
  }

  onFilterChange = (e) => {
    this.setState({filterValue: e.target.value.trim()});
  }

  getHeaderContent() {
    return (
      <span>
        Configuration
        <span className="title-separator">/</span>
        {this.props.routes[this.props.routes.length - 1].name}
      </span>
    );
  }

  handleKeyPress = (event) => {
    if (event.key === "Enter") {
      this.refs.Modal.state.show
        ? this.handleSave()
        : '';
    }
  }

  render() {
    const {
      entities,
      parentId,
      currentId,
      modalTitle,
      filterValue,
      fetchLoader
    } = this.state;
    const filterByTagName = function(entities, filterValue) {
      let matchFilter = new RegExp(filterValue, 'i');
      const filter = (arr) => {
        return arr.filter(filteredList => {
          let res = (matchFilter.test(filteredList.name)
            ? filteredList
            : undefined);
          if (!res) {
            if (filteredList.children) {
              let child = filter(filteredList.children);
              if (child.length) {
                return filteredList;
              }
            }
          } else {
            return res;
          }
        });
      };
      return filter(entities);
    };
    const filteredEntities = filterByTagName(entities || [], filterValue) || [];

    return (
      <BaseContainer ref="BaseContainer" routes={this.props.routes} headerContent={this.getHeaderContent()}>
        {fetchLoader
          ? <CommonLoaderSign imgName={"default"}/>
          : <div>
            <div className="row">
              <div className="page-title-box clearfix">
                <div className="col-md-3 col-md-offset-8 text-right">
                  {filteredEntities.length !== 0
                    ? <FormGroup>
                        <InputGroup>
                          <FormControl type="text" placeholder="Search by name" onKeyUp={this.onFilterChange} className="" />
                          <InputGroup.Addon>
                            <i className="fa fa-search"></i>
                          </InputGroup.Addon>
                        </InputGroup>
                      </FormGroup>
                    : ''
}
                </div>
                <div id="add-environment">
                  <a href="javascript:void(0);" className="hb lg success actionDropdown" data-target="#addEnvironment" onClick={this.handleAdd.bind(this, null)}>
                    <i className="fa fa-plus"></i>
                  </a>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-sm-12">

                {(filteredEntities.length === 0)
                  ? <NoData imgName={"default"}/>
                  : <div className="box">
                    <div className="box-body">
                      <Nestable useDragHandle items={filteredEntities} renderItem={this.renderItem.bind(this)} onUpdate={this.updateItems.bind(this)} childrenStyle={styles.children}/>
                    </div>
                  </div>
}
              </div>
            </div>
          </div>
}
        <Modal ref="Modal" onKeyPress={this.handleKeyPress} data-title={modalTitle} data-resolve={this.handleSave.bind(this)}>
          <TagsFormContainer ref="addTag" parentId={parentId} currentId={currentId}/>
        </Modal>
      </BaseContainer>
    );
  }
}
