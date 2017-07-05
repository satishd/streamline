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
package com.hortonworks.streamline.streams.storm.common;

import com.hortonworks.streamline.common.JsonClientUtil;
import com.hortonworks.streamline.common.exception.WrappedWebApplicationException;
import com.hortonworks.streamline.common.util.WSUtils;
import org.apache.commons.lang.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.security.auth.Subject;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.client.Client;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.MultivaluedHashMap;
import java.io.IOException;
import java.security.PrivilegedAction;
import java.util.Map;

import static com.hortonworks.streamline.common.util.WSUtils.encode;

public class StormRestAPIClient {
    private static final Logger LOG = LoggerFactory.getLogger(StormRestAPIClient.class);

    public static final MediaType STORM_REST_API_MEDIA_TYPE = MediaType.APPLICATION_JSON_TYPE;
    private final String stormApiRootUrl;
    private final Subject subject;
    private final Client client;

    public StormRestAPIClient(Client client, String stormApiRootUrl, Subject subject) {
        this.client = client;
        this.stormApiRootUrl = stormApiRootUrl;
        this.subject = subject;
    }

    public Map getTopologySummary(String asUser) {
        return doGetRequest(generateTopologyUrl(null, asUser, "summary"));
    }

    public Map getTopology(String topologyId, String asUser) {
        return doGetRequest(generateTopologyUrl(topologyId, asUser, ""));
    }

    public Map getComponent(String topologyId, String componentId, String asUser) {
        return doGetRequest(generateTopologyUrl(topologyId, asUser, "component/" + encode(componentId)));
    }

    public boolean killTopology(String stormTopologyId, String asUser, int waitTime) {
        Map result = doPostRequestWithEmptyBody(generateTopologyUrl(stormTopologyId, asUser, "kill/" + waitTime));
        return isPostOperationSuccess(result);
    }

    public boolean activateTopology(String stormTopologyId, String asUser) {
        Map result = doPostRequestWithEmptyBody(generateTopologyUrl(stormTopologyId, asUser, "activate"));
        return isPostOperationSuccess(result);
    }

    public boolean deactivateTopology(String stormTopologyId, String asUser) {
        Map result = doPostRequestWithEmptyBody(generateTopologyUrl(stormTopologyId, asUser, "deactivate"));
        return isPostOperationSuccess(result);
    }

    private Map doGetRequest(String requestUrl) {
        try {
            LOG.debug("GET request to Storm cluster: " + requestUrl);
            return Subject.doAs(subject, new PrivilegedAction<Map>() {
                @Override
                public Map run() {
                    return JsonClientUtil.getEntity(client.target(requestUrl), STORM_REST_API_MEDIA_TYPE, Map.class);
                }
            });
        } catch (RuntimeException ex) {
            // JsonClientUtil wraps exception, so need to compare
            if (ex.getCause() instanceof javax.ws.rs.ProcessingException) {
                if (ex.getCause().getCause() instanceof IOException) {
                    throw new StormNotReachableException("Exception while requesting " + requestUrl, ex);
                }
            } else if (ex.getCause() instanceof WebApplicationException) {
                throw WrappedWebApplicationException.of((WebApplicationException) ex.getCause());
            }

            throw ex;
        }
    }

    private Map doPostRequestWithEmptyBody(String requestUrl) {
        try {
            LOG.debug("POST request to Storm cluster: " + requestUrl);
            return Subject.doAs(subject, new PrivilegedAction<Map>() {
                @Override
                public Map run() {
                    return JsonClientUtil.postForm(client.target(requestUrl), new MultivaluedHashMap<>(),
                            STORM_REST_API_MEDIA_TYPE, Map.class);
                }
            });
        } catch (javax.ws.rs.ProcessingException e) {
            if (e.getCause() instanceof IOException) {
                throw new StormNotReachableException("Exception while requesting " + requestUrl, e);
            }

            throw e;
        } catch (WebApplicationException e) {
            throw WrappedWebApplicationException.of(e);
        }
    }

    private String generateTopologyUrl(String topologyId, String asUser, String operation) {
        String baseUrl = stormApiRootUrl + "/topology";
        if(StringUtils.isNotEmpty(topologyId)) {
            baseUrl = "/" + WSUtils.encode(topologyId);
        }
        if(StringUtils.isNotEmpty(operation)) {
            baseUrl = "/" + operation;
        }

        if (StringUtils.isNotEmpty(asUser)) {
            baseUrl += "?doAsUser=" + WSUtils.encode(asUser);
        }
        return baseUrl;
    }

    private boolean isPostOperationSuccess(Map result) {
        return result != null && result.get("status").equals("success");
    }

}
