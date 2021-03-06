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

import React, {Component, PropTypes} from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import {Link} from 'react-router';
import moment from 'moment';
import {DropdownButton, MenuItem, Button ,FormGroup,InputGroup,FormControl} from 'react-bootstrap';
import Modal from '../../components/FSModal';
import {Scrollbars} from 'react-custom-scrollbars';

/* import common utils*/
import ClusterREST from '../../rest/ClusterREST';
import Utils from '../../utils/Utils';
import TopologyUtils from '../../utils/TopologyUtils';
import FSReactToastr from '../../components/FSReactToastr';

/* component import */
import BaseContainer from '../BaseContainer';
import NoData from '../../components/NoData';
import CommonNotification from '../../utils/CommonNotification';
import {toastOpt} from '../../utils/Constants';
import Paginate from '../../components/Paginate';
import CommonLoaderSign from '../../components/CommonLoaderSign';
import AddManualCluster from '../ManualCluster/AddManualCluster';
import AddManualService from '../ManualCluster/AddManualService';

/*
  ServiceItems is a stateless component to display a service image on UI
  And
  if Manual CLuster is created we Add plus button to UI for adding services manually
*/
const ServiceItems = (props) => {
  const {item} = props;
  let name = item.name.replace('_', ' ');
  return (
    item.manualClusterId
    ? <li><img src="styles/img/plus.png" alt="plus button" onClick={props.addManualService} data-id={item.manualClusterId}/>Add New</li>
    : <li><img src={`styles/img/icon-${item.name.toLowerCase()}.png`}/>{name}</li>
  );
};

/*
  PoolItemsCard is a React Component with state
  And contains single CARD item
*/
class PoolItemsCard extends Component {
  constructor(props) {
    super(props);
  }


  /*
    onActionClick accept eventKey example "refresh"
    call this.props.poolActionClicked with params eventKey and fetch Id from the dataset
  */
  onActionClick = (eventKey) => {
    this.props.poolActionClicked(eventKey, this.clusterRef.dataset.id);
  }

  /*
    checkRefId accept id
    check the id in "this.props.refIdArr"
    if yes return true else false
  */
  checkRefId = (id) => {
    const index = this.props.refIdArr.findIndex((x) => {
      return x === id;
    });
    return index !== -1
      ? true
      : false;
  }

  /*
    addManualService accept click event
    check target node element
    on the bases fetch id from the dataset
    Add called props.addManualServiceHandler function
  */
  addManualService = (event) => {
    const mClusterId = (event.target.nodeName !== 'I') ? parseInt(event.target.dataset.id) : parseInt(event.target.parentElement.dataset.id);
    this.props.addManualServiceHandler(mClusterId);
  }

  render() {
    const {clusterList, loader} = this.props;
    const {cluster, services} = clusterList;
    const tempArr = services || {
      service: (services === undefined)
        ? ''
        : services.service
    };
    let serviceWrap = [];
    let t = [];
    tempArr.map((s) => {
      if (s.service.name.length > 8) {
        t.push(s);
      } else {
        serviceWrap.push(s);
      }
    });
    Array.prototype.push.apply(serviceWrap, t);
    const ellipseIcon = <i className="fa fa-ellipsis-v"></i>;
    {/*
      Add a button to serviceWrap for only Manually created cluster
    */}
    const manual_index = _.findIndex(serviceWrap, {name : 'addManualBtn'});
    if(manual_index === -1 && clusterList.cluster.ambariImportUrl === ''){
      serviceWrap.push({service :{name : 'addManualBtn', manualClusterId : clusterList.cluster.id}});
    }

    return (
      <div className="col-md-4">
        <div className="service-box" data-id={cluster.id} ref={(ref) => this.clusterRef = ref}>
          <div className="service-head clearfix">
            <h4 className="no-margin">{cluster.name}
              <span className="display-block">{cluster.ambariImportUrl ? cluster.ambariImportUrl : cluster.description}</span>
            </h4>
            <div className="service-action-btn">
              <DropdownButton noCaret title={ellipseIcon} id="dropdown" bsStyle="link" className="dropdown-toggle" data-stest="service-pool-actions">
                {
                  cluster.ambariImportUrl
                  ? <MenuItem onClick={this.onActionClick.bind(this, "refresh/")} data-stest="edit-service-pool">
                      <i className="fa fa-refresh"></i>
                      &nbsp;Refresh
                    </MenuItem>
                  : ''
                }
                <MenuItem onClick={this.onActionClick.bind(this, "delete/")} data-stest="delete-service-pool">
                  <i className="fa fa-trash"></i>
                  &nbsp;Delete
                </MenuItem>
              </DropdownButton>
            </div>
          </div>
          <div className="service-body clearfix">
            {(this.checkRefId(cluster.id))
              ? <div className="service-components">
                  <div className="loading-img text-center">
                    <img src="styles/img/start-loader.gif" alt="loading"/>
                  </div>
                </div>
              : <Scrollbars style={{
                height: "185px"
              }} autoHide renderThumbHorizontal={props => <div {...props} style={{
                display: "none"
              }}/>}>
                <ul className="service-components ">
                  {serviceWrap.length !== 0
                    ? serviceWrap.map((items, i) => {
                      return <ServiceItems key={i} item={items.service} addManualService={this.addManualService}/>;
                    })
                    : <div className="col-sm-12 text-center">
                          No Service
                      </div>

}
                </ul>
              </Scrollbars>
}
          </div>
        </div>
      </div>
    );
  }
}
PoolItemsCard.propTypes = {
  poolActionClicked: React.PropTypes.func.isRequired
};

class ServicePoolContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      entities: [],
      loader: false,
      refIdArr: [],
      idCheck: '',
      showFields: false,
      showInputErr: true,
      clusterData: {},
      fetchLoader: true,
      pageIndex: 0,
      pageSize: 6,
      mClusterId: '',
      mClusterServiceUpdate : false,
      mServiceNameList : [],
      filterValue: ''
    };
    this.fetchData();
  }

  /*
    fetchData is called from the constructor
    To fetch the cluster entities through an API call
    SET entities and pageIndex to "0"
  */
  fetchData = () => {
    ClusterREST.getAllCluster().then((clusters) => {
      if (clusters.responseMessage !== undefined) {
        FSReactToastr.error(
          <CommonNotification flag="error" content={clusters.responseMessage}/>, '', toastOpt);
        this.setState({fetchLoader: false});
      } else {
        let result = clusters.entities;
        this.setState({fetchLoader: false, entities: result, pageIndex: 0});
      }
    }).catch((err) => {
      this.setState({fetchLoader: false});
      FSReactToastr.error(
        <CommonNotification flag="error" content={err.message}/>, '', toastOpt);
    });
  }

  /*
    btnClassChange  method
    container is select by using document.querySelector
    to set a class on container
  */
  btnClassChange = () => {
    const container = document.querySelector('.content-wrapper');
    container.setAttribute("class", "content-wrapper animated fadeIn ");
  }

  /*
    componentDidUpdate method
    this.btnClassChange is called to set a class on container
  */
  componentDidUpdate() {
    this.btnClassChange();
  }

  /*
    componentDidMount method
    this.btnClassChange is called to set a class on container
  */
  componentDidMount() {
    this.btnClassChange();
  }

  /*
    componentWillUnmount method
    this.btnClassChange is called to set a class on container
  */
  componentWillUnmount() {
    this.btnClassChange();
  }

  /*
    addBtnClicked method
    url value is fetch from UI using "this.refs.addURLInput.value"
    And Utils.validateURL is called to check the url contain
    "api/v1/catalog"
    if true it SET state with clusterName and ambariUrl
    else return false
  */
  addBtnClicked = () => {
    const {showInputErr} = this.state;
    const val = this.refs.addURLInput.value.trim();

    if (Utils.validateURL(val) && val.length !== 0) {
      const name = this.sliceClusterUrl(val);
      const tempObj = Object.assign(this.state.clusterData, {
        clusterName: name,
        ambariUrl: val
      });
      this.setState({
        showInputErr: true,
        clusterData: tempObj
      }, this.adminFormModel.show());
      this.refs.addURLInput.value = '';
    } else {
      this.setState({showInputErr: false});
    }
  }

  /*
    sliceClusterUrl accept url "http://localhost:8080/api/v1/catalog/clusters/demo"
    url is substring by the last '/'
    return demo from url
  */
  sliceClusterUrl = (url) => {
    return url.substr((url.lastIndexOf('/') + 1), url.length);
  }

  /*
    poolActionClicked accept the eventKey and id exm "refresh" and "2"
    poolActionClicked method is call on multiple button
    And on the bases of eventKey futhere method is called
  */
  poolActionClicked = (eventKey, id) => {
    const key = eventKey.split('/');
    switch (key[0].toString()) {
    case "refresh":
      this.handleUpdateCluster(id);
      break;
    case "delete":
      this.handleDeleteCluster(id);
      break;
    default:
      break;
    }
  }

  /*
    handleUpdateCluster accept id
    single cluster is updated through an API call using id

    refIdArr is used to show loading on UI
    Awaiting for ManualCluster changes from backend that's
    why the else part is commented
  */
  handleUpdateCluster = (ID) => {
    ClusterREST.getCluster(ID).then((entity) => {
      if (entity.responseMessage !== undefined) {
        FSReactToastr.error(
          <CommonNotification flag="error" content={entity.responseMessage}/>, '', toastOpt);
      } else {
        const url = entity.cluster.ambariImportUrl.trim();
        if(url){
          const tempObj = Object.assign(this.state.clusterData, {ambariUrl: url});
          this.setState({
            showFields: true,
            idCheck: + ID,
            clusterData: tempObj
          }, () => {
            this.adminFormModel.show();
          });
        } //else {
          // this.setState({
          //   showFields: true,
          //   idCheck: + ID,
          //   mClusterId : + ID,
          //   mClusterServiceUpdate: true
          // }, () => {
          //   this.addManualServiceModal.show();
          // });
        //}
      }
    });

  }

  /*
    handleDeleteCluster accept the id as a Params
    to delete a cluster through an API call by using id
  */
  handleDeleteCluster = (id) => {
    this.refs.BaseContainer.refs.Confirm.show({title: 'Are you sure you want to delete ?'}).then((confirmBox) => {
      ClusterREST.deleteCluster(id).then((cluster) => {

        confirmBox.cancel();
        if (cluster.responseMessage !== undefined) {
          if (cluster.responseMessage.indexOf('Namespace refers the cluster') !== 1) {
            FSReactToastr.info(
              <CommonNotification flag="info" content={"This cluster is shared with some environment. So it can't be deleted."}/>, '', toastOpt);
          } else {
            FSReactToastr.error(
              <CommonNotification flag="error" content={cluster.responseMessage}/>, '', toastOpt);
          }
        } else {
          this.setState({
            fetchLoader: true
          }, () => {
            this.fetchData();
            clearTimeout(clearTimer);
            const clearTimer = setTimeout(() => {
              FSReactToastr.success(
                <strong>cluster deleted successfully</strong>
              );
            }, 500);
          });
        }
      });
    });
  }

  /*
    validateForm method
    It itreate all fields present in "this.refs.modelForm.children"
    if the value is empty after focus the invalidInput class is added to particular node
  */
  validateForm = () => {
    const formNodes = this.refs.modelForm.children;
    let errArr = [];
    const filter = (nodes) => {
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].children) {
          for (let j = 0; j < nodes[i].children.length; j++) {
            if (nodes[i].children[j].nodeName === "INPUT") {
              if (nodes[i].children[j].value.trim() === '') {
                nodes[i].children[j].setAttribute('class', "form-control invalidInput");
                errArr.push(j);
              } else {
                nodes[i].children[j].setAttribute('class', "form-control");
              }
            }
          }
        }
      }
      if (errArr.length === 0) {
        if (this.state.idCheck.length !== 0 && this.state.showFields) {
          const url = this.refs.userUrl.value.trim();
          if (!Utils.validateURL(url)) {
            this.refs.userUrl.setAttribute('class', "form-control invalidInput");
            return false;
          }
        }
        this.fetchFormdata();
        return true;
      } else {
        return false;
      }
    };
    return filter(formNodes);
  }

  /*
    fetchFormdata method
    fields value is fetch from the form by using the refs
    And SET to the state
  */
  fetchFormdata = () => {
    let tempCluster = {},
      name = '';
    const {idCheck, clusterData, showFields} = this.state;
    const userName = this.refs.username.value.trim();
    const passWord = this.refs.userpass.value.trim();
    if (idCheck.length !== 0 && showFields) {
      const url = this.refs.userUrl.value.trim();
      name = this.sliceClusterUrl(url);
      tempCluster = Object.assign(clusterData, {
        clusterName: name,
        ambariUrl: url
      });
    }
    tempCluster = Object.assign(clusterData, {
      username: userName,
      password: passWord
    });
    this.setState({clusterData: tempCluster});
  }

  /*
    fetchClusterDetail method
    Is used to create a cluster by calling and API
    using the data Object with fields
    clusterName , description, ambariUrl

    refIdArr array is used to show loading on UI
    ON the API success we call this.importAmbariCluster(id) with cluster id as a Params
    And fetchData to fetch the new data for UI
  */
  fetchClusterDetail = () => {
    const {clusterData, refIdArr} = this.state;
    const {clusterName, ambariUrl} = clusterData;
    let data = {
      name: clusterName,
      description: "This is an auto generated description",
      ambariImportUrl: ambariUrl
    };
    ClusterREST.postCluster({body: JSON.stringify(data)}).then((cluster) => {
      if (cluster.responseMessage !== undefined) {
        FSReactToastr.error(
          <CommonNotification flag="error" content={cluster.responseMessage}/>, '', toastOpt);
        this.setState({loader: false});
      } else {
        const id = cluster.id;
        const tempArr = refIdArr;
        tempArr.push(id);
        this.setState({
          refIdArr: tempArr,
          loader: false,
          idCheck: ''
        }, () => {
          this.importAmbariCluster(id);
          this.fetchData();
        });
      }
    });
  }

  /*
    adminSaveClicked method
    In this ambariUrl is verified through the API call for that
    we created "urlVerificationData" Object with fields
    ambariUrl, username, password

    showFields fields is used to show Add and Edit Model
    On Edit mode we call this.importAmbariCluster()
    On Add mode we call this.fetchClusterDetail()
  */
  adminSaveClicked = () => {
    if (this.validateForm()) {
      const {idCheck, showFields, clusterData} = this.state;
      const {ambariUrl, username, password} = clusterData;
      const urlVerificationData = {
        ambariRestApiRootUrl: ambariUrl,
        username: username,
        password: password
      };

      ClusterREST.postAmbariClusterVerifyURL({body: JSON.stringify(urlVerificationData)}).then(urlVerify => {
        if (urlVerify.verified) {
          (showFields)
            ? this.importAmbariCluster()
            : this.fetchClusterDetail();
          this.adminFormModel.hide();
          this.setState({showFields: false});
        } else {
          let response = urlVerify.responseMessage;
          if (response !== undefined) {
            let errorMsg = response;
            errorMsg = response.indexOf('Cluster not found') !== -1
              ? "Ambari cluster not found"
              : response.indexOf('Unable to sign in') !== -1
                ? "You have entered wrong username or password"
                : response.indexOf('Bad input') !== -1
                  ? "Not valid Ambari API URL"
                  : response;
            FSReactToastr.error(
              <CommonNotification flag="error" content={errorMsg}/>, '', toastOpt);
          }
        }
      });
    }
  }

  /*
    importAmbariCluster accept id
    And is call from the Two function "adminSaveClicked and fetchClusterDetail"
    importClusterData Object is created with the fields
    clusterID, ambariUrl, username, password
    idCheck is push to tempArr for showing loader on a particular cluster on UI
    POST method is call to save ambariCluster
  */
  importAmbariCluster = (id) => {
    const {clusterData, idCheck, refIdArr} = this.state;
    const {ambariUrl, username, password} = clusterData;
    const clusterID = id;
    const importClusterData = {
      clusterId: clusterID || idCheck,
      ambariRestApiRootUrl: ambariUrl,
      username: username,
      password: password
    };
    const tempArr = refIdArr;
    tempArr.push(idCheck);
    this.setState({refIdArr: tempArr});
    // Post call for import cluster from ambari
    ClusterREST.postAmbariCluster({body: JSON.stringify(importClusterData)}).then((ambarClusters) => {
      let obj = {};
      if (ambarClusters.responseMessage !== undefined) {
        this.setState({
          loader: false,
          idCheck: ''
        }, () => {
          this.fetchData();
          // setTimeout is used to delay the error notification on UI
          clearTimeout(clearTimer);
          const clearTimer = setTimeout(() => {
            FSReactToastr.error(
              <CommonNotification flag="error" content={errorMsg}/>, '', toastOpt);
          }, 500);
        });
      } else {
        const result = ambarClusters;
        let entitiesWrap = [],
          sucessMsg = '';
        if (idCheck) {
          //Update Single Cluster
          const elPosition = this.state.entities.map(function(x) {
            return x.cluster.id;
          }).indexOf(idCheck);
          entitiesWrap = this.state.entities;
          entitiesWrap[elPosition] = result;
          sucessMsg = "Process completed successfully";
        } else {
          sucessMsg = "Cluster added successfully";
        }
        // splice the id refIdArr
        const tempDataArray = this.spliceTempArr(clusterID || idCheck);

        this.setState({
          fetchLoader: (idCheck)
            ? false
            : true,
          loader: false,
          idCheck: '',
          entities: entitiesWrap,
          refIdArr: tempDataArray
        }, () => {
          sucessMsg.indexOf("added") !== - 1
            ? this.fetchData()
            : '';
          // setTimeout is used to delay the success notification on UI
          clearTimeout(clearTimer);
          const clearTimer = setTimeout(() => {
            FSReactToastr.success(
              <strong>{sucessMsg}</strong>
            );
          }, 500);
        });
      }
    });
  }

  /*
    spliceTempArr accept id
    And check the id is present in refIdArr
    if exist splice it from refIdArr and SET in state
  */
  spliceTempArr = (id) => {
    const tempArr = this.state.refIdArr;
    const index = tempArr.findIndex((x) => {
      return x === id;
    });
    if (index !== -1) {
      tempArr.splice(index, 1);
    }
    return tempArr;
  }

  /*
    adminCancelClicked method
    idCheck, showFields and refIdArr are SET
    adminFormModel is trigger to hide
  */
  adminCancelClicked = () => {
    const {idCheck} = this.state;
    const tempDataArray = this.spliceTempArr(idCheck);
    this.setState({idCheck: '', showFields: false, refIdArr: tempDataArray});
    this.adminFormModel.hide();
  }

  /*
    pagePosition accept the index from the pagination
    And SET pageIndex
  */
  pagePosition = (index) => {
    this.setState({
      pageIndex: index || 0
    });
  }

  /*
    getHeaderContent is used to show the component name
    picked from the routes for UI
  */
  getHeaderContent() {
    return (
      <span>
        Configuration
        <span className="title-separator">/</span>
        {this.props.routes[this.props.routes.length - 1].name}
      </span>
    );
  }

  /*
    handleKeyPress accept event
    To catch Enter key from UI
    And on the Modal showing bases we trigger the method
  */
  handleKeyPress = (event) => {
    if (event.key === "Enter") {
      if(!this.adminFormModel.state.show && !this.addManualClusterModal.state.show && !this.addManualServiceModal.state.show){
        if (event.target.placeholder.indexOf('http://ambari_host') !== -1) {
          event.target.focus = false;
          this.addBtnClicked();
        }
      }
      this.adminFormModel.state.show
        ? this.adminSaveClicked()
        : this.addManualClusterModal.state.show
          ? this.addManualClusterSave()
          : this.addManualServiceModal.state.show
            ? this.addManualServiceSave()
            : '';
    }
  }

  /*
    addManualCluster
    trigger this.addManualClusterModal.show
  */
  addManualCluster = () => {
    this.addManualClusterModal.show();
  }

  /*
    addManualClusterSave is used to call addManualClusterRef validate
    And trigger the addManualClusterRef handleSave for completing the Process
    creating cluster
    And show the success on UI
  */
  addManualClusterSave = () => {
    if(this.refs.addManualClusterRef.validateForm()){
      this.addManualClusterModal.hide();
      this.refs.addManualClusterRef.handleSave().then((manualCluster) => {
        if(manualCluster.responseMessage !== undefined){
          FSReactToastr.error(
            <CommonNotification flag="error" content={manualCluster.responseMessage}/>, '', toastOpt);
        } else {
          FSReactToastr.success(
            <strong>{"Manual cluster add successfully"}</strong>);
          this.fetchData();
        }
      });
    }
  }

  /*
    addManualCommonCancel method accept name "cluster" OR "service"
    used the cancel the Modal
  */
  addManualCommonCancel = (name) => {
    name === "cluster"
    ? this.addManualClusterModal.hide()
    : name === "service"
      ? this.addManualServiceModal.hide()
      : '';
  }

  /*
  addManualServiceHandler accept cluster Id
  cluster is filter from the entities using Id
  from the cluster the existing services are pull in mServiceNameList
  mServiceNameList is passed as props to addManualServiceRef
  */
  addManualServiceHandler = (Id) => {
    let serviceArr = [];
    const m_clusterIndex = _.findIndex(this.state.entities,(entity) => {
      return entity.cluster.id === Id;
    });
    if(m_clusterIndex !== -1){
      _.map(this.state.entities[m_clusterIndex].services, (serviceEntity) => {
        serviceArr.push(serviceEntity.service);
      });
    }
    this.setState({mClusterId : Id , mServiceNameList:serviceArr}, () => {
      this.addManualServiceModal.show();
    });
  }

  /*
    addManualServiceSave is used to call addManualServiceRef validate
    And trigger the addManualServiceRef handleSave for completing the Process
    for register service
    And show the success on UI
  */
  addManualServiceSave = () => {
    if(this.refs.addManualServiceRef.validate()){
      this.addManualServiceModal.hide();
      this.refs.addManualServiceRef.handleSave().then((manualService) => {
        if(manualService.responseMessage !== undefined){
          FSReactToastr.error(
            <CommonNotification flag="error" content={manualService.responseMessage}/>, '', toastOpt);
        } else {
          FSReactToastr.success(
            <strong>{"Manual service add successfully"}</strong>);
          this.fetchData();
        }
      });
    }
  }

  onFilterChange = (e) => {
    this.setState({filterValue: e.target.value.trim()});
  }

  render() {
    const {routes} = this.props;
    const {
      showInputErr,
      entities,
      showFields,
      fetchLoader,
      pageSize,
      pageIndex,
      refIdArr,
      loader,
      clusterData,
      mClusterId,
      mClusterServiceUpdate,
      mServiceNameList,
      filterValue
    } = this.state;
    const {ambariUrl} = clusterData;
    const filteredEntities = TopologyUtils.topologyFilter(entities, filterValue,"cluster");
    const splitData = _.chunk(filteredEntities, pageSize) || [];
    const adminFormFields = () => {
      return <form className="modal-form config-modal-form" ref="modelForm">
        {loader || showFields
          ? <div className="form-group">
              <label>Url<span className="text-danger">*</span>
              </label>
              <input data-stest="url" type="text" className="form-control" placeholder="http://ambari_host:port/api/v1/clusters/CLUSTER_NAME" ref="userUrl" autoFocus="true" disabled={true} value={ambariUrl}/>
              <p className="text-danger"></p>
            </div>
          : ''
}
        <div className="form-group">
          <label data-stest="usernamelabel">UserName<span className="text-danger">*</span>
          </label>
          <input data-stest="username" type="text" className="form-control" placeholder="Enter your Name" ref="username" autoFocus={showFields
            ? false
            : true}/>
          <p className="text-danger"></p>
        </div>
        <div className="form-group">
          <label data-stest="passwordLabel">Password<span className="text-danger">*</span>
          </label>
          <input data-stest="password" type="password" className="form-control" placeholder="Enter your Password" ref="userpass"/>
          <p className="text-danger"></p>
        </div>
      </form>;
    };

    return (
      <BaseContainer ref="BaseContainer" routes={routes} headerContent={this.getHeaderContent()}>
        {fetchLoader
          ? <CommonLoaderSign imgName={"services"}/>
          : <div>
            {
              (filterValue && splitData.length === 0) || splitData.length !== 0
              ? <div className="row">
                  <div className="page-title-box clearfix">
                    <div className="col-md-3 col-md-offset-8 text-right">
                      <FormGroup>
                        <InputGroup>
                        <FormControl data-stest="searchBox" type="text" placeholder="Search by name" onKeyUp={this.onFilterChange} className="" />
                        <InputGroup.Addon>
                          <i className="fa fa-search"></i>
                        </InputGroup.Addon>
                        </InputGroup>
                      </FormGroup>
                    </div>
                  </div>
                </div>
              : ''
            }
            <div className="row row-margin-bottom">
              <div className="col-md-8 col-md-offset-2">
                <div className="input-group">
                  <input data-stest="url" type="text" ref="addURLInput" onKeyPress={this.handleKeyPress} className={`form-control ${showInputErr
                    ? ''
                    : 'invalidInput'}`} placeholder="http://ambari_host:port/api/v1/clusters/CLUSTER_NAME"/>
                  <span className="input-group-btn">
                    <button className="btn btn-success" type="button" onClick={this.addBtnClicked}>
                      AUTO ADD
                    </button>
                  </span>
                </div>
                <lable data-stest="validationMsg" className={`text-danger ${showInputErr
                  ? 'hidden'
                  : ''}`}>This is not a valid Url</lable>
              </div>
              <div className="col-md-2">
                <button className="btn btn-default" type="button" onClick={this.addManualCluster}>
                  MANUAL
                </button>
              </div>
            </div>
            <div className="row">
              {(splitData.length === 0)
                ? <NoData imgName={"services"}/>
                : splitData[pageIndex].map((list) => {
                  return <PoolItemsCard key={list.cluster.id} clusterList={list} poolActionClicked={this.poolActionClicked} refIdArr={refIdArr} loader={loader} addManualServiceHandler={this.addManualServiceHandler}/>;
                })
}
            </div>
          </div>
}
        {(entities.length > pageSize)
          ? <Paginate len={entities.length} splitData={splitData} pagesize={pageSize} pagePosition={this.pagePosition}/>
          : ''
}
        <Modal ref={(ref) => this.adminFormModel = ref} data-title="Credentials" onKeyPress={this.handleKeyPress} data-resolve={this.adminSaveClicked} data-reject={this.adminCancelClicked}>
          {adminFormFields()}
        </Modal>
        <Modal ref={(ref) => this.addManualClusterModal = ref} data-title="Add Manual Cluster" data-resolve={this.addManualClusterSave} data-reject={this.addManualCommonCancel.bind(this,'cluster')} onKeyPress={this.handleKeyPress}>
          <AddManualCluster ref="addManualClusterRef"/>
        </Modal>
        <Modal ref={(ref) => this.addManualServiceModal = ref} data-title={mClusterServiceUpdate ? "Edit Manual Service" : "Add Manual Service"}  data-resolve={this.addManualServiceSave} data-reject={this.addManualCommonCancel.bind(this,'service')} onKeyPress={this.handleKeyPress}>
          <AddManualService ref="addManualServiceRef" mClusterId={mClusterId} mClusterServiceUpdate={mClusterServiceUpdate} serviceNameList={mServiceNameList}/>
        </Modal>
      </BaseContainer>
    );
  }
}

export default ServicePoolContainer;
